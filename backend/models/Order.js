const mongoose = require('mongoose');

/**
 * Order Item Schema for individual items in an order
 */
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
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
  imageUrl: {
    type: String,
    trim: true
  },
  // Snapshot of product details at time of order
  category: String,
  brand: String,
  sku: String
}, {
  _id: false // Don't generate separate _id for order items
});

/**
 * Shipping Address Schema
 */
const shippingAddressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true,
    maxlength: [200, 'Street address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true,
    maxlength: [20, 'ZIP code cannot exceed 20 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    default: 'United States',
    maxlength: [50, 'Country cannot exceed 50 characters']
  }
}, {
  _id: false
});

/**
 * Order Schema for managing customer orders
 */
const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Customer information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Order items and pricing
  items: [orderItemSchema],
  
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative']
  },
  
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  
  // Shipping information
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  
  // Payment information
  paymentIntentId: {
    type: String,
    required: true,
    trim: true
  },
  
  paymentStatus: {
    type: String,
    enum: [
      'pending',
      'processing',
      'succeeded',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded'
    ],
    default: 'pending',
    index: true
  },
  
  paymentMethod: {
    type: String,
    default: 'stripe'
  },
  
  // Order status and fulfillment
  orderStatus: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ],
    default: 'pending',
    index: true
  },
  
  // Shipping and tracking
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight'],
    default: 'standard'
  },
  
  trackingNumber: {
    type: String,
    trim: true
  },
  
  shippingCarrier: {
    type: String,
    trim: true
  },
  
  // Important dates
  orderDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  paidAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Estimated delivery date
  estimatedDelivery: Date,
  
  // Order notes and metadata
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  
  // Customer service and returns
  isReturnable: {
    type: Boolean,
    default: true
  },
  
  returnWindow: {
    type: Number,
    default: 30 // days
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for better query performance
 */
orderSchema.index({ userId: 1, orderDate: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ paymentIntentId: 1 });

/**
 * Pre-save middleware to generate order number
 */
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    // Generate unique order number: SW + timestamp + random 3 digits
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `SW${timestamp}${random}`;
    
    // Ensure uniqueness (very unlikely collision, but just in case)
    const existing = await this.constructor.findOne({ orderNumber: this.orderNumber });
    if (existing) {
      const extraRandom = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      this.orderNumber = `SW${timestamp}${random}${extraRandom}`;
    }
  }
  next();
});

/**
 * Virtual for total number of items in order
 */
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Virtual for order age in days
 */
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24));
});

/**
 * Virtual to check if order can be cancelled
 */
orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.orderStatus) && 
         ['pending', 'processing'].includes(this.paymentStatus);
});

/**
 * Virtual to check if order can be returned
 */
orderSchema.virtual('canBeReturned').get(function() {
  if (!this.isReturnable || !this.deliveredAt) return false;
  
  const returnDeadline = new Date(this.deliveredAt);
  returnDeadline.setDate(returnDeadline.getDate() + this.returnWindow);
  
  return Date.now() < returnDeadline.getTime() && this.orderStatus === 'delivered';
});

/**
 * Virtual for formatted total price
 */
orderSchema.virtual('formattedTotal').get(function() {
  return `$${this.totalPrice.toFixed(2)}`;
});

/**
 * Instance method to update order status
 * @param {string} status - New order status
 * @param {string} adminNotes - Optional admin notes
 * @returns {Promise<Order>} - Updated order
 */
orderSchema.methods.updateStatus = async function(status, adminNotes) {
  this.orderStatus = status;
  
  if (adminNotes) {
    this.adminNotes = adminNotes;
  }
  
  // Set relevant timestamps
  switch (status) {
    case 'shipped':
      this.shippedAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
  }
  
  return await this.save();
};

/**
 * Instance method to update payment status
 * @param {string} status - New payment status
 * @returns {Promise<Order>} - Updated order
 */
orderSchema.methods.updatePaymentStatus = async function(status) {
  this.paymentStatus = status;
  
  if (status === 'succeeded') {
    this.paidAt = new Date();
    // Auto-confirm order when payment succeeds
    if (this.orderStatus === 'pending') {
      this.orderStatus = 'confirmed';
    }
  }
  
  return await this.save();
};

/**
 * Instance method to add tracking information
 * @param {string} trackingNumber - Tracking number
 * @param {string} carrier - Shipping carrier
 * @returns {Promise<Order>} - Updated order
 */
orderSchema.methods.addTracking = async function(trackingNumber, carrier) {
  this.trackingNumber = trackingNumber;
  this.shippingCarrier = carrier;
  
  // Auto-update status to shipped if not already
  if (this.orderStatus === 'processing' || this.orderStatus === 'confirmed') {
    this.orderStatus = 'shipped';
    this.shippedAt = new Date();
  }
  
  return await this.save();
};

/**
 * Static method to find orders by user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<Order[]>} - Array of orders
 */
orderSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort);
  else query.sort({ orderDate: -1 });
  
  return query.populate('userId', 'name email');
};

/**
 * Static method to find orders by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Order[]>} - Array of orders
 */
orderSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    orderDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ orderDate: -1 });
};

/**
 * Static method to get order statistics
 * @param {Date} startDate - Start date (optional)
 * @param {Date} endDate - End date (optional)
 * @returns {Promise<Object>} - Order statistics
 */
orderSchema.statics.getStatistics = async function(startDate, endDate) {
  const matchConditions = {};
  
  if (startDate || endDate) {
    matchConditions.orderDate = {};
    if (startDate) matchConditions.orderDate.$gte = startDate;
    if (endDate) matchConditions.orderDate.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' },
        totalItemsSold: { $sum: { $sum: '$items.quantity' } }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItemsSold: 0
  };
};

/**
 * Transform toJSON to format output
 */
orderSchema.methods.toJSON = function() {
  const orderObject = this.toObject();
  
  // Remove version key
  delete orderObject.__v;
  
  return orderObject;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;