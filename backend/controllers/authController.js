const User = require('../models/User');
const Cart = require('../models/Cart');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../middlewares/auth');
const { clearSessionCookie } = require('../middlewares/session');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password
  });

  // Generate JWT token
  const token = generateToken(user._id, user.role);

  // Set httpOnly cookie (optional - client can choose to use header instead)
  setTokenCookie(res, token);

  // Update last login
  await user.updateLastLogin();

  // Merge guest cart if session exists
  let cart = null;
  if (req.sessionId) {
    try {
      cart = await Cart.mergeGuestCartIntoUserCart(req.sessionId, user._id);
      clearSessionCookie(res); // Clear session cookie after merge
    } catch (error) {
      console.warn('Failed to merge guest cart:', error.message);
      // Don't fail registration if cart merge fails
      cart = await Cart.findOrCreateUserCart(user._id);
    }
  } else {
    cart = await Cart.findOrCreateUserCart(user._id);
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      token, // Also return token in response body for flexible client handling
      cart: {
        id: cart._id,
        totalItems: cart.totalItems,
        totalValue: cart.totalValue
      }
    }
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password for comparison
  const user = await User.findByEmail(email).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }

  // Validate password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate JWT token
  const token = generateToken(user._id, user.role);

  // Set httpOnly cookie
  setTokenCookie(res, token);

  // Update last login
  await user.updateLastLogin();

  // Merge guest cart if session exists
  let cart = null;
  if (req.sessionId) {
    try {
      cart = await Cart.mergeGuestCartIntoUserCart(req.sessionId, user._id);
      clearSessionCookie(res); // Clear session cookie after merge
    } catch (error) {
      console.warn('Failed to merge guest cart:', error.message);
      // Don't fail login if cart merge fails
      cart = await Cart.findOrCreateUserCart(user._id);
    }
  } else {
    cart = await Cart.findOrCreateUserCart(user._id);
  }

  // Remove password from user object
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      token,
      cart: {
        id: cart._id,
        totalItems: cart.totalItems,
        totalValue: cart.totalValue
      }
    }
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // Clear authentication cookie
  clearTokenCookie(res);
  
  // Clear session cookie as well
  clearSessionCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  // User is attached to request by authMiddleware
  const user = req.user;

  // Get user's cart
  const cart = await Cart.findOrCreateUserCart(user._id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      cart: {
        id: cart._id,
        totalItems: cart.totalItems,
        totalValue: cart.totalValue
      }
    }
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const { name, phone, address } = req.body;

  // Update allowed fields
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Refresh token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const user = req.user;

  // Generate new token
  const token = generateToken(user._id, user.role);

  // Set new httpOnly cookie
  setTokenCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

/**
 * Delete user account (soft delete)
 * DELETE /api/auth/account
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  const { password } = req.body;

  // Verify password before deletion
  const userWithPassword = await User.findById(user._id).select('+password');
  const isPasswordValid = await userWithPassword.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Password verification failed'
    });
  }

  // Soft delete - deactivate account instead of removing
  user.isActive = false;
  user.email = `deleted_${user._id}_${user.email}`; // Prevent email conflicts
  await user.save();

  // Clear cookies
  clearTokenCookie(res);
  clearSessionCookie(res);

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  deleteAccount
};