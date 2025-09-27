const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
  getCartCount,
  validateCart
} = require('../controllers/cartController');
const { optionalAuth } = require('../middlewares/auth');
const { sessionMiddleware } = require('../middlewares/session');
const { handleValidationErrors } = require('../middlewares/errorHandler');
const {
  validateAddToCart,
  validateUpdateCartItem,
  validateRemoveCartItem
} = require('../utils/validation');

const router = express.Router();

/**
 * Rate limiting for cart routes
 */
const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for cart operations
  message: {
    success: false,
    message: 'Too many cart requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply middleware to all cart routes
router.use(cartLimiter);
router.use(optionalAuth); // Check for authentication but don't require it
router.use(sessionMiddleware); // Handle session for guest users

/**
 * @route   GET /api/cart
 * @desc    Get user's cart (authenticated user or guest session)
 * @access  Public
 */
router.get('/', getCart);

/**
 * @route   GET /api/cart/count
 * @desc    Get cart item count
 * @access  Public
 */
router.get('/count', getCartCount);

/**
 * @route   GET /api/cart/validate
 * @desc    Validate cart items (check availability and prices)
 * @access  Public
 */
router.get('/validate', validateCart);

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Public
 */
router.post('/',
  validateAddToCart,
  handleValidationErrors,
  addToCart
);

/**
 * @route   POST /api/cart/merge
 * @desc    Merge guest cart into user cart (requires authentication)
 * @access  Private
 */
router.post('/merge', mergeCart);

/**
 * @route   PUT /api/cart/:itemId
 * @desc    Update cart item quantity
 * @access  Public
 */
router.put('/:itemId',
  validateUpdateCartItem,
  handleValidationErrors,
  updateCartItem
);

/**
 * @route   DELETE /api/cart/:itemId
 * @desc    Remove item from cart
 * @access  Public
 */
router.delete('/:itemId',
  validateRemoveCartItem,
  handleValidationErrors,
  removeCartItem
);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Public
 */
router.delete('/clear', clearCart);

module.exports = router;