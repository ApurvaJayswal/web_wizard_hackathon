const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getProducts,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateStock,
  toggleFeatured,
  getLowStockProducts
} = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/errorHandler');
const {
  validateProduct,
  validateProductId,
  validatePagination,
  validateProductSearch
} = require('../utils/validation');

const router = express.Router();

/**
 * Rate limiting for product routes
 */
const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs for product operations
  message: {
    success: false,
    message: 'Too many product requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // More restrictive for admin operations
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ========== PUBLIC ROUTES ==========

/**
 * @route   GET /api/products
 * @desc    Get all products with pagination, search, and filters
 * @access  Public
 */
router.get('/',
  productLimiter,
  validatePagination,
  validateProductSearch,
  handleValidationErrors,
  getProducts
);

/**
 * @route   GET /api/products/search
 * @desc    Search products by text
 * @access  Public
 */
router.get('/search',
  productLimiter,
  searchProducts
);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured',
  productLimiter,
  getFeaturedProducts
);

/**
 * @route   GET /api/products/categories/list
 * @desc    Get all product categories with counts
 * @access  Public
 */
router.get('/categories/list',
  productLimiter,
  getCategories
);

/**
 * @route   GET /api/products/category/:category
 * @desc    Get products by category
 * @access  Public
 */
router.get('/category/:category',
  productLimiter,
  validatePagination,
  handleValidationErrors,
  getProductsByCategory
);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id',
  productLimiter,
  validateProductId,
  handleValidationErrors,
  getProduct
);

// ========== ADMIN ONLY ROUTES ==========

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin only)
 */
router.post('/',
  adminLimiter,
  authMiddleware,
  adminMiddleware,
  validateProduct,
  handleValidationErrors,
  createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 */
router.put('/:id',
  adminLimiter,
  authMiddleware,
  adminMiddleware,
  validateProductId,
  validateProduct,
  handleValidationErrors,
  updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id',
  adminLimiter,
  authMiddleware,
  adminMiddleware,
  validateProductId,
  handleValidationErrors,
  deleteProduct
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Admin only)
 */
router.patch('/:id/stock',
  adminLimiter,
  authMiddleware,
  adminMiddleware,
  validateProductId,
  handleValidationErrors,
  updateStock
);

/**
 * @route   PATCH /api/products/:id/featured
 * @desc    Toggle product featured status
 * @access  Private (Admin only)
 */
router.patch('/:id/featured',
  adminLimiter,
  authMiddleware,
  adminMiddleware,
  validateProductId,
  handleValidationErrors,
  toggleFeatured
);

/**
 * @route   GET /api/products/admin/low-stock
 * @desc    Get low stock products
 * @access  Private (Admin only)
 */
router.get('/admin/low-stock',
  adminLimiter,
  authMiddleware,
  adminMiddleware,
  getLowStockProducts
);

module.exports = router;