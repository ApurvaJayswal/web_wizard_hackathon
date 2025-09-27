# 🚀 SwiftCart Backend API

A complete e-commerce backend built with Node.js, Express, MongoDB, and Stripe integration.

## 🌟 Features

### 🔐 Authentication & User Management
- JWT-based authentication with httpOnly cookies
- User registration and login
- Password hashing with bcrypt
- Role-based access control (User/Admin)
- Session management for guest users
- Secure logout with token cleanup

### 📦 Product Catalog Management
- Full CRUD operations for products
- Advanced search and filtering
- Category-based organization
- Stock management
- Featured products
- Admin-only product management

### 🛒 Shopping Cart System
- Session-based cart for guest users
- Persistent cart for authenticated users
- Automatic cart merging on login
- Real-time stock validation
- Cart persistence across sessions

### 💳 Checkout & Order Processing
- Stripe PaymentIntent integration
- Secure payment processing
- Order creation and management
- Order history and tracking
- Admin order management
- Webhook handling for payment updates

### 🔒 Security Features
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Error handling and logging
- Secure cookie management

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Processing**: Stripe
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Morgan
- **Environment**: dotenv

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection setup
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── cartController.js     # Cart management
│   ├── orderController.js    # Order and checkout processing
│   └── productController.js  # Product management
├── middlewares/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Global error handling
│   └── session.js           # Session management
├── models/
│   ├── User.js              # User data model
│   ├── Product.js           # Product data model
│   ├── Cart.js              # Cart data model
│   └── Order.js             # Order data model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── cart.js              # Cart routes
│   ├── orders.js            # Order routes
│   └── products.js          # Product routes
├── utils/
│   ├── stripe.js            # Stripe payment utilities
│   └── validation.js        # Validation schemas
├── .env.example             # Environment variables template
├── package.json             # Project dependencies
├── server.js                # Main application entry point
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Stripe account for payments

### Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/swiftcart
   JWT_SECRET=your_super_secret_jwt_key_here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   CLIENT_URL=http://localhost:5173
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/logout` | User logout | Public |
| GET | `/auth/me` | Get current user | Private |
| PUT | `/auth/profile` | Update user profile | Private |
| PUT | `/auth/change-password` | Change password | Private |
| DELETE | `/auth/account` | Delete account | Private |

### 📦 Product Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/products` | Get all products | Public |
| GET | `/products/:id` | Get product by ID | Public |
| GET | `/products/featured` | Get featured products | Public |
| GET | `/products/category/:category` | Get products by category | Public |
| GET | `/products/search` | Search products | Public |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |

### 🛒 Cart Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/cart` | Get user's cart | Public |
| POST | `/cart` | Add item to cart | Public |
| PUT | `/cart/:itemId` | Update cart item | Public |
| DELETE | `/cart/:itemId` | Remove cart item | Public |
| DELETE | `/cart/clear` | Clear entire cart | Public |
| GET | `/cart/count` | Get cart item count | Public |
| POST | `/cart/merge` | Merge guest cart | Private |

### 📋 Order Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/checkout` | Create checkout session | Private |
| POST | `/orders/confirm` | Confirm order | Private |
| GET | `/orders/my` | Get user's orders | Private |
| GET | `/orders/:id` | Get order by ID | Private |
| PATCH | `/orders/:id/cancel` | Cancel order | Private |
| GET | `/orders` | Get all orders | Admin |
| PATCH | `/orders/:id/status` | Update order status | Admin |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | development |
| `PORT` | Server port | No | 5000 |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRE` | JWT expiration time | No | 7d |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes | - |
| `CLIENT_URL` | Frontend URL for CORS | No | http://localhost:5173 |

### Database Setup

1. **Local MongoDB**:
   ```bash
   # Install MongoDB locally or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **MongoDB Atlas** (recommended for production):
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create cluster and get connection string
   - Update `MONGO_URI` in `.env`

### Stripe Setup

1. Create account at [Stripe](https://stripe.com)
2. Get API keys from Dashboard → API Keys
3. Set up webhook endpoint: `https://yourdomain.com/api/orders/webhook`
4. Update environment variables with your keys

## 🏗️ Development

### Scripts

```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests (when implemented)
```

### Code Style

- Use ES6+ features
- Follow RESTful API conventions
- Implement proper error handling
- Add JSDoc comments for functions
- Use async/await for promises

### Adding New Features

1. **Models**: Add new Mongoose schemas in `/models`
2. **Controllers**: Implement business logic in `/controllers`
3. **Routes**: Define API endpoints in `/routes`
4. **Middleware**: Add reusable middleware in `/middlewares`
5. **Validation**: Add input validation in `/utils/validation.js`

## 🧪 Testing

### Manual Testing

Use tools like Postman or Thunder Client to test endpoints:

1. **Health Check**: `GET /health`
2. **User Registration**: `POST /api/auth/register`
3. **Product Listing**: `GET /api/products`
4. **Cart Operations**: Test cart CRUD operations

### API Testing Collection

Import the provided Postman collection (if available) for comprehensive API testing.

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/swiftcart
   JWT_SECRET=super_secure_production_secret
   STRIPE_SECRET_KEY=sk_live_your_live_key
   CLIENT_URL=https://yourdomain.com
   ```

### Deployment Platforms

- **Railway**: Connect GitHub repo and deploy
- **Render**: Easy Node.js deployment
- **DigitalOcean**: App Platform or Droplets
- **AWS**: EC2, Elastic Beanstalk, or Lambda
- **Google Cloud**: App Engine or Cloud Run

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB Atlas cluster
- [ ] Configure production Stripe keys
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up CI/CD pipeline

## 📊 Monitoring & Logging

### Application Logs

The application uses Morgan for HTTP request logging:
- Development: `dev` format (colored output)
- Production: `combined` format (Apache style)

### Health Check

Monitor application health via `/health` endpoint:
```json
{
  "success": true,
  "message": "SwiftCart API is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## 🛡️ Security Considerations

### Implemented Security Measures

1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing protection
3. **Rate Limiting**: Prevents abuse
4. **Input Validation**: Sanitizes user input
5. **JWT Tokens**: Secure authentication
6. **Password Hashing**: bcrypt with salt rounds
7. **HttpOnly Cookies**: Prevents XSS attacks

### Additional Recommendations

- Use HTTPS in production
- Implement API versioning
- Set up monitoring and alerting
- Regular security audits
- Keep dependencies updated

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:

1. Check this documentation
2. Review the code comments
3. Test with the provided examples
4. Open an issue on GitHub

## 🎯 Roadmap

Future enhancements:
- [ ] Email notifications
- [ ] Advanced search filters
- [ ] Product reviews and ratings
- [ ] Inventory management
- [ ] Analytics dashboard
- [ ] Multi-currency support
- [ ] Internationalization (i18n)

---

Built with ❤️ for the Web Wizard Hackathon