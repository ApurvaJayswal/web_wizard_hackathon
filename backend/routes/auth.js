const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  deleteAccount
} = require('../controllers/authController');
const { authMiddleware, optionalAuth } = require('../middlewares/auth');
const { sessionMiddleware } = require('../middlewares/session');
const { handleValidationErrors } = require('../middlewares/errorHandler');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateAccountDeletion
} = require('../utils/validation');

const router = express.Router();

/**
 * Rate limiting for authentication routes
 * More restrictive limits for login/register to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth operations
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for general operations
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  optionalAuth, // Check for existing user session
  sessionMiddleware, // Handle guest cart session
  validateRegister,
  handleValidationErrors,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  authLimiter,
  optionalAuth, // Check for existing user session
  sessionMiddleware, // Handle guest cart session
  validateLogin,
  handleValidationErrors,
  login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookies)
 * @access  Public
 */
router.post('/logout',
  generalLimiter,
  logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  generalLimiter,
  authMiddleware,
  getMe
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  generalLimiter,
  authMiddleware,
  validateProfileUpdate,
  handleValidationErrors,
  updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authLimiter, // More restrictive for password changes
  authMiddleware,
  validatePasswordChange,
  handleValidationErrors,
  changePassword
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh',
  generalLimiter,
  authMiddleware,
  refreshToken
);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete('/account',
  authLimiter, // More restrictive for account deletion
  authMiddleware,
  validateAccountDeletion,
  handleValidationErrors,
  deleteAccount
);

module.exports = router;