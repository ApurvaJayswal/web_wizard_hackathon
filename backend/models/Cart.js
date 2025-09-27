const mongoose = require('mongoose');

/**
 * Cart Item Schema for individual cart items
 */
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  // Store price at time of adding to cart (for price change tracking)
  priceAtAdd: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, {
  _id: true, // Enable _id for cart items for easier updates/removal
  timestamps: true
});

/**
 * Cart Schema for managing shopping carts
 * Supports both guest carts (sessionId) and user carts (userId)
 */
const cartSchema = new mongoose.Schema({
  // Either userId OR sessionId should be present, not both for the same cart
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  sessionId: {
    type: String,
    default: null,
    index: true,
    trim: true
  },
  items: [cartItemSchema],
  
  // Cart metadata
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted'],
    default: 'active'
  },
  
  // Expiry date for guest carts (auto cleanup)
  expiresAt: {
    type: Date,
    default: function() {
      // Guest carts expire in 30 days, user carts don't expire
      return this.userId ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Compound indexes for better query performance
 */
cartSchema.index({ userId: 1, status: 1 });
cartSchema.index({ sessionId: 1, status: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto cleanup

/**
 * Validation to ensure either userId or sessionId is present
 */
cartSchema.pre('validate', function(next) {
  if (!this.userId && !this.sessionId) {
    return next(new Error('Cart must have either userId or sessionId'));
  }
  if (this.userId && this.sessionId) {
    // If both are present, prioritize userId and clear sessionId
    this.sessionId = null;
  }
  next();
});

/**
 * Virtual for total number of items in cart
 */
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Virtual for total cart value (based on current prices)
 */
cartSchema.virtual('totalValue').get(function() {
  return this.items.reduce((total, item) => {
    if (item.productId && item.productId.price) {
      return total + (item.productId.price * item.quantity);
    }
    return total + (item.priceAtAdd * item.quantity); // Fallback to stored price
  }, 0);
});

/**
 * Virtual for cart value based on prices when items were added
 */
cartSchema.virtual('originalValue').get(function() {
  return this.items.reduce((total, item) => total + (item.priceAtAdd * item.quantity), 0);
});

/**
 * Virtual to check if cart is empty
 */
cartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

/**
 * Instance method to add item to cart
 * @param {Object} productData - Product data
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Cart>} - Updated cart
 */
cartSchema.methods.addItem = async function(productData, quantity = 1) {
  const existingItemIndex = this.items.findIndex(
    item => item.productId.toString() === productData._id.toString()
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      productId: productData._id,
      quantity: quantity,
      priceAtAdd: productData.price
    });
  }

  return await this.save();
};

/**
 * Instance method to update item quantity
 * @param {string} itemId - Cart item ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Cart>} - Updated cart
 */
cartSchema.methods.updateItemQuantity = async function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Cart item not found');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    this.items.pull(itemId);
  } else {
    item.quantity = quantity;
  }

  return await this.save();
};

/**
 * Instance method to remove item from cart
 * @param {string} itemId - Cart item ID
 * @returns {Promise<Cart>} - Updated cart
 */
cartSchema.methods.removeItem = async function(itemId) {
  this.items.pull(itemId);
  return await this.save();
};

/**
 * Instance method to clear all items from cart
 * @returns {Promise<Cart>} - Updated cart
 */
cartSchema.methods.clearCart = async function() {
  this.items = [];
  return await this.save();
};

/**
 * Instance method to convert cart to order format
 * @returns {Object} - Order-ready cart data
 */
cartSchema.methods.toOrderFormat = function() {
  return {
    items: this.items.map(item => ({
      productId: item.productId._id || item.productId,
      quantity: item.quantity,
      price: item.productId.price || item.priceAtAdd,
      name: item.productId.name,
      imageUrl: item.productId.imageUrl
    })),
    totalValue: this.totalValue,
    originalValue: this.originalValue,
    totalItems: this.totalItems
  };
};

/**
 * Static method to find or create cart for user
 * @param {string} userId - User ID
 * @returns {Promise<Cart>} - User's cart
 */
cartSchema.statics.findOrCreateUserCart = async function(userId) {
  let cart = await this.findOne({ userId, status: 'active' })
    .populate('items.productId');
    
  if (!cart) {
    cart = new this({ userId, items: [] });
    await cart.save();
  }
  
  return cart;
};

/**
 * Static method to find or create cart for session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Cart>} - Session's cart
 */
cartSchema.statics.findOrCreateSessionCart = async function(sessionId) {
  let cart = await this.findOne({ sessionId, status: 'active' })
    .populate('items.productId');
    
  if (!cart) {
    cart = new this({ sessionId, items: [] });
    await cart.save();
  }
  
  return cart;
};

/**
 * Static method to merge guest cart into user cart
 * @param {string} sessionId - Guest session ID
 * @param {string} userId - User ID to merge into
 * @returns {Promise<Cart>} - Merged user cart
 */
cartSchema.statics.mergeGuestCartIntoUserCart = async function(sessionId, userId) {
  const [guestCart, userCart] = await Promise.all([
    this.findOne({ sessionId, status: 'active' }).populate('items.productId'),
    this.findOrCreateUserCart(userId)
  ]);

  if (!guestCart || guestCart.items.length === 0) {
    return userCart;
  }

  // Merge guest cart items into user cart
  for (const guestItem of guestCart.items) {
    if (guestItem.productId && guestItem.productId.isActive) {
      await userCart.addItem(guestItem.productId, guestItem.quantity);
    }
  }

  // Mark guest cart as converted and remove it
  guestCart.status = 'converted';
  await guestCart.save();

  return userCart.populate('items.productId');
};

/**
 * Static method to cleanup expired carts
 * @returns {Promise<number>} - Number of carts removed
 */
cartSchema.statics.cleanupExpiredCarts = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
    status: 'active'
  });
  
  return result.deletedCount;
};

/**
 * Transform toJSON to format output
 */
cartSchema.methods.toJSON = function() {
  const cartObject = this.toObject();
  
  // Remove version key and sensitive data
  delete cartObject.__v;
  
  return cartObject;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;