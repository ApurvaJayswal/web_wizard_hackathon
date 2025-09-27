const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  checkout,
  confirmOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  addTracking,
  getOrderStats,
  handleWebhook
} = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/errorHandler');
const { validateCheckout } = require('../utils/validation');

const router = express.Router();

/**
 * Rate limiting for order routes
 */
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for order operations
  message: {
    success: false,
    message: 'Too many order requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // More restrictive for checkout operations
  message: {
    success: false,
    message: 'Too many checkout attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for webhooks
  message: {
    success: false,
    message: 'Too many webhook requests'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ========== PUBLIC/USER ROUTES ==========

/**
 * @route   POST /api/checkout
 * @desc    Create checkout session and PaymentIntent
 * @access  Private
 */
router.post('/checkout',
  checkoutLimiter,
  authMiddleware,
  validateCheckout,
  handleValidationErrors,
  checkout
);

/**
 * @route   POST /api/orders/confirm
 * @desc    Confirm order after successful payment
 * @access  Private
 */
router.post('/confirm',
  orderLimiter,
  authMiddleware,
  confirmOrder
);

/**
 * @route   GET /api/orders/my
 * @desc    Get user's orders
 * @access  Private
 */
router.get('/my',
  orderLimiter,
  authMiddleware,
  getMyOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private
 */
router.get('/:id',
  orderLimiter,
  authMiddleware,
  getOrder
);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order (if possible)
 * @access  Private
 */
router.patch('/:id/cancel',
  orderLimiter,
  authMiddleware,
  cancelOrder
);

// ========== ADMIN ONLY ROUTES ==========

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/',
  orderLimiter,
  authMiddleware,
  adminMiddleware,
  getAllOrders
);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin only)
 */
router.patch('/:id/status',
  orderLimiter,
  authMiddleware,
  adminMiddleware,
  updateOrderStatus
);

/**
 * @route   PATCH /api/orders/:id/tracking
 * @desc    Add tracking information to order
 * @access  Private (Admin only)
 */
router.patch('/:id/tracking',
  orderLimiter,
  authMiddleware,
  adminMiddleware,
  addTracking
);

/**
 * @route   GET /api/orders/admin/stats
 * @desc    Get order statistics
 * @access  Private (Admin only)
 */
router.get('/admin/stats',
  orderLimiter,
  authMiddleware,
  adminMiddleware,
  getOrderStats
);

// ========== WEBHOOK ROUTES ==========

/**
 * @route   POST /api/orders/webhook
 * @desc    Handle Stripe webhooks (raw body required)
 * @access  Public (Stripe only)
 * @note    This route needs raw body parsing, handled in main server file
 */
router.post('/webhook',
  webhookLimiter,
  handleWebhook
);

module.exports = router;