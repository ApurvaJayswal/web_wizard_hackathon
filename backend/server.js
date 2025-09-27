const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configurations and utilities
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

// Initialize Express app
const app = express();

// ==========================================
// Database Connection
// ==========================================
connectDB();

// ==========================================
// Security Middleware
// ==========================================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Global limit for all requests
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for webhooks
  skip: (req) => req.path === '/api/orders/webhook'
});

app.use(globalLimiter);

// ==========================================
// Body Parsing Middleware
// ==========================================

// Raw body parser for Stripe webhooks (must come before express.json())
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));

// URL encoded body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// ==========================================
// Logging Middleware
// ==========================================

// Morgan logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ==========================================
// API Routes
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SwiftCart API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API route prefix
const API_PREFIX = '/api';

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}`, orderRoutes); // Includes /checkout and /orders

// API documentation endpoint
app.get(`${API_PREFIX}`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SwiftCart API',
    version: '1.0.0',
    documentation: {
      authentication: `${API_PREFIX}/auth/*`,
      products: `${API_PREFIX}/products/*`,
      cart: `${API_PREFIX}/cart/*`,
      orders: `${API_PREFIX}/orders/*`,
      checkout: `${API_PREFIX}/checkout`
    },
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password'
      },
      products: {
        getAll: 'GET /api/products',
        getOne: 'GET /api/products/:id',
        create: 'POST /api/products (Admin)',
        update: 'PUT /api/products/:id (Admin)',
        delete: 'DELETE /api/products/:id (Admin)',
        categories: 'GET /api/products/categories/list',
        featured: 'GET /api/products/featured'
      },
      cart: {
        get: 'GET /api/cart',
        add: 'POST /api/cart',
        update: 'PUT /api/cart/:itemId',
        remove: 'DELETE /api/cart/:itemId',
        clear: 'DELETE /api/cart/clear',
        count: 'GET /api/cart/count'
      },
      orders: {
        checkout: 'POST /api/checkout',
        confirm: 'POST /api/orders/confirm',
        myOrders: 'GET /api/orders/my',
        getOrder: 'GET /api/orders/:id',
        cancel: 'PATCH /api/orders/:id/cancel'
      }
    }
  });
});

// ==========================================
// Error Handling Middleware
// ==========================================

// 404 handler (must come after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// ==========================================
// Server Startup
// ==========================================

const PORT = process.env.PORT || 5000;

// Graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                        🚀 SwiftCart API                        ║
║                                                                ║
║  Server running on port: ${PORT.toString().padEnd(41)} ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(48)} ║
║  Database: MongoDB                                             ║
║  API Documentation: http://localhost:${PORT}/api                 ║
║  Health Check: http://localhost:${PORT}/health                  ║
║                                                                ║
║  Ready to handle requests! 🎉                                 ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Promise Rejection:', err.message);
  // Close server and exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception:', err.message);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});

// Graceful shutdown on SIGTERM and SIGINT
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated');
    process.exit(0);
  });
});

module.exports = app;