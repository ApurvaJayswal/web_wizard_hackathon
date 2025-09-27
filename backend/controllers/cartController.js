const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Get user's cart
 * GET /api/cart
 */
const getCart = asyncHandler(async (req, res) => {
  let cart;

  if (req.user) {
    // Authenticated user - get user cart
    cart = await Cart.findOrCreateUserCart(req.user._id);
  } else if (req.sessionId) {
    // Guest user - get session cart
    cart = await Cart.findOrCreateSessionCart(req.sessionId);
  } else {
    // No user or session - return empty cart
    return res.status(200).json({
      success: true,
      data: {
        cart: {
          items: [],
          totalItems: 0,
          totalValue: 0,
          originalValue: 0,
          isEmpty: true
        }
      }
    });
  }

  res.status(200).json({
    success: true,
    data: { cart }
  });
});

/**
 * Add item to cart
 * POST /api/cart
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  // Find and validate product
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (!product.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Product is not available'
    });
  }

  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} items available in stock`
    });
  }

  // Get or create cart
  let cart;
  if (req.user) {
    cart = await Cart.findOrCreateUserCart(req.user._id);
  } else if (req.sessionId) {
    cart = await Cart.findOrCreateSessionCart(req.sessionId);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Unable to identify cart session'
    });
  }

  // Check if adding this quantity would exceed available stock
  const existingItem = cart.items.find(
    item => item.productId.toString() === productId
  );
  const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
  const totalQuantity = currentQuantityInCart + quantity;

  if (totalQuantity > product.stock) {
    return res.status(400).json({
      success: false,
      message: `Cannot add ${quantity} more items. Maximum available: ${product.stock - currentQuantityInCart}`
    });
  }

  // Add item to cart
  await cart.addItem(product, quantity);

  // Refresh cart with populated product data
  const updatedCart = await Cart.findById(cart._id).populate('items.productId');

  res.status(200).json({
    success: true,
    message: 'Item added to cart successfully',
    data: { cart: updatedCart }
  });
});

/**
 * Update cart item quantity
 * PUT /api/cart/:itemId
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  // Get cart
  let cart;
  if (req.user) {
    cart = await Cart.findOne({ userId: req.user._id, status: 'active' })
      .populate('items.productId');
  } else if (req.sessionId) {
    cart = await Cart.findOne({ sessionId: req.sessionId, status: 'active' })
      .populate('items.productId');
  } else {
    return res.status(400).json({
      success: false,
      message: 'Cart not found'
    });
  }

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  // Find the cart item
  const cartItem = cart.items.id(itemId);
  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  // Check product availability
  if (!cartItem.productId || !cartItem.productId.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Product is no longer available'
    });
  }

  if (quantity > cartItem.productId.stock) {
    return res.status(400).json({
      success: false,
      message: `Only ${cartItem.productId.stock} items available in stock`
    });
  }

  // Update item quantity
  await cart.updateItemQuantity(itemId, quantity);

  // Refresh cart with populated product data
  const updatedCart = await Cart.findById(cart._id).populate('items.productId');

  res.status(200).json({
    success: true,
    message: 'Cart item updated successfully',
    data: { cart: updatedCart }
  });
});

/**
 * Remove item from cart
 * DELETE /api/cart/:itemId
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  // Get cart
  let cart;
  if (req.user) {
    cart = await Cart.findOne({ userId: req.user._id, status: 'active' });
  } else if (req.sessionId) {
    cart = await Cart.findOne({ sessionId: req.sessionId, status: 'active' });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Cart not found'
    });
  }

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  // Check if item exists in cart
  const cartItem = cart.items.id(itemId);
  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  // Remove item from cart
  await cart.removeItem(itemId);

  // Refresh cart with populated product data
  const updatedCart = await Cart.findById(cart._id).populate('items.productId');

  res.status(200).json({
    success: true,
    message: 'Item removed from cart successfully',
    data: { cart: updatedCart }
  });
});

/**
 * Clear entire cart
 * DELETE /api/cart/clear
 */
const clearCart = asyncHandler(async (req, res) => {
  // Get cart
  let cart;
  if (req.user) {
    cart = await Cart.findOne({ userId: req.user._id, status: 'active' });
  } else if (req.sessionId) {
    cart = await Cart.findOne({ sessionId: req.sessionId, status: 'active' });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Cart not found'
    });
  }

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  // Clear all items from cart
  await cart.clearCart();

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      cart: {
        items: [],
        totalItems: 0,
        totalValue: 0,
        originalValue: 0,
        isEmpty: true
      }
    }
  });
});

/**
 * Merge guest cart into user cart after login
 * POST /api/cart/merge
 */
const mergeCart = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required'
    });
  }

  try {
    // Merge guest cart into user cart
    const mergedCart = await Cart.mergeGuestCartIntoUserCart(sessionId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Cart merged successfully',
      data: { cart: mergedCart }
    });
  } catch (error) {
    console.error('Cart merge error:', error);
    // If merge fails, just return user's existing cart
    const userCart = await Cart.findOrCreateUserCart(req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: { cart: userCart }
    });
  }
});

/**
 * Get cart item count
 * GET /api/cart/count
 */
const getCartCount = asyncHandler(async (req, res) => {
  let cart;

  if (req.user) {
    cart = await Cart.findOne({ userId: req.user._id, status: 'active' });
  } else if (req.sessionId) {
    cart = await Cart.findOne({ sessionId: req.sessionId, status: 'active' });
  }

  const count = cart ? cart.totalItems : 0;

  res.status(200).json({
    success: true,
    data: { count }
  });
});

/**
 * Validate cart items (check availability and prices)
 * GET /api/cart/validate
 */
const validateCart = asyncHandler(async (req, res) => {
  let cart;

  if (req.user) {
    cart = await Cart.findOne({ userId: req.user._id, status: 'active' })
      .populate('items.productId');
  } else if (req.sessionId) {
    cart = await Cart.findOne({ sessionId: req.sessionId, status: 'active' })
      .populate('items.productId');
  }

  if (!cart || cart.items.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        isValid: true,
        issues: [],
        cart: cart || { items: [], totalItems: 0, totalValue: 0 }
      }
    });
  }

  const issues = [];
  let hasChanges = false;

  // Check each cart item
  for (const item of cart.items) {
    if (!item.productId || !item.productId.isActive) {
      // Product no longer available
      issues.push({
        itemId: item._id,
        type: 'unavailable',
        message: 'Product is no longer available',
        productName: item.productId ? item.productId.name : 'Unknown Product'
      });
      // Remove unavailable item
      cart.items.pull(item._id);
      hasChanges = true;
    } else if (item.productId.stock < item.quantity) {
      // Insufficient stock
      const availableStock = item.productId.stock;
      if (availableStock === 0) {
        issues.push({
          itemId: item._id,
          type: 'out_of_stock',
          message: 'Product is out of stock',
          productName: item.productId.name
        });
        // Remove out of stock item
        cart.items.pull(item._id);
        hasChanges = true;
      } else {
        issues.push({
          itemId: item._id,
          type: 'insufficient_stock',
          message: `Only ${availableStock} items available, quantity adjusted`,
          productName: item.productId.name,
          originalQuantity: item.quantity,
          adjustedQuantity: availableStock
        });
        // Adjust quantity to available stock
        item.quantity = availableStock;
        hasChanges = true;
      }
    } else if (item.priceAtAdd !== item.productId.price) {
      // Price changed
      issues.push({
        itemId: item._id,
        type: 'price_change',
        message: 'Product price has changed',
        productName: item.productId.name,
        oldPrice: item.priceAtAdd,
        newPrice: item.productId.price
      });
      // Update price
      item.priceAtAdd = item.productId.price;
      hasChanges = true;
    }
  }

  // Save changes if any
  if (hasChanges) {
    await cart.save();
  }

  res.status(200).json({
    success: true,
    data: {
      isValid: issues.length === 0,
      issues,
      cart: cart
    }
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
  getCartCount,
  validateCart
};