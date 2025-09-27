const { body, param, query } = require('express-validator');

/**
 * Validation for user registration
 */
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

/**
 * Validation for user login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation for profile update
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ZIP code cannot exceed 20 characters'),
  
  body('address.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country cannot exceed 50 characters')
];

/**
 * Validation for password change
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

/**
 * Validation for account deletion
 */
const validateAccountDeletion = [
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deletion')
];

/**
 * Validation for product creation/update
 */
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .custom((value) => {
      // Check for max 2 decimal places
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new Error('Price can have at most 2 decimal places');
      }
      return true;
    }),
  
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('imageUrl')
    .isURL()
    .withMessage('Please provide a valid image URL'),
  
  body('category')
    .isIn([
      'electronics',
      'clothing',
      'books',
      'home-garden',
      'sports',
      'toys',
      'beauty',
      'automotive',
      'food',
      'other'
    ])
    .withMessage('Please select a valid category'),
  
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand name cannot exceed 50 characters'),
  
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a non-negative number'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

/**
 * Validation for product ID parameter
 */
const validateProductId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID')
];

/**
 * Validation for cart operations
 */
const validateAddToCart = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

/**
 * Validation for cart item update
 */
const validateUpdateCartItem = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid cart item ID'),
  
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

/**
 * Validation for cart item removal
 */
const validateRemoveCartItem = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid cart item ID')
];

/**
 * Validation for checkout
 */
const validateCheckout = [
  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and cannot exceed 50 characters'),
  
  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and cannot exceed 50 characters'),
  
  body('shippingAddress.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('shippingAddress.phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Street address is required and cannot exceed 200 characters'),
  
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('City is required and cannot exceed 50 characters'),
  
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('State is required and cannot exceed 50 characters'),
  
  body('shippingAddress.zipCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('ZIP code is required and cannot exceed 20 characters'),
  
  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country cannot exceed 50 characters'),
  
  body('shippingMethod')
    .optional()
    .isIn(['standard', 'express', 'overnight'])
    .withMessage('Invalid shipping method')
];

/**
 * Validation for pagination and sorting
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'createdAt', 'averageRating', 'stock'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation for product search and filters
 */
const validateProductSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .isIn([
      'electronics',
      'clothing',
      'books',
      'home-garden',
      'sports',
      'toys',
      'beauty',
      'automotive',
      'food',
      'other'
    ])
    .withMessage('Invalid category'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a non-negative number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a non-negative number'),
  
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean value')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateAccountDeletion,
  validateProduct,
  validateProductId,
  validateAddToCart,
  validateUpdateCartItem,
  validateRemoveCartItem,
  validateCheckout,
  validatePagination,
  validateProductSearch
};