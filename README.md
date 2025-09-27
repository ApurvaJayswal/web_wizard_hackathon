# SwiftCart - E-commerce Frontend

A modern, responsive e-commerce frontend built with React, TypeScript, Tailwind CSS, and React Router. Features a complete shopping experience with product browsing, cart management, user authentication, and checkout flow.

## 🚀 Features

### 🛍️ Shopping Experience
- **Product Catalog**: Browse products with search and category filtering
- **Product Details**: Comprehensive product pages with images, descriptions, and reviews
- **Shopping Cart**: Add, update, and remove items with real-time totals
- **Checkout**: Complete checkout flow with address and payment forms

### 👤 User Management
- **Authentication**: Login and registration with form validation
- **Protected Routes**: Secure access to checkout and user-specific pages
- **Order History**: View past orders and track status
- **Admin Panel**: Admin-only order management interface

### 🎨 Design & UX
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI**: Clean, professional design with smooth animations
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Loading States**: User-friendly loading indicators and error handling

## 🛠️ Technologies Used

- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Tailwind CSS** for responsive styling
- **shadcn/ui** for consistent UI components
- **React Hook Form** for form validation
- **Axios** for API calls
- **React Query** for state management

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swiftcart-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Update the environment variables as needed.

4. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) to view the app.

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Pages & Routes

### Public Routes
- `/` - Home page with product catalog
- `/product/:id` - Product detail page
- `/cart` - Shopping cart
- `/login` - User login
- `/register` - User registration

### Protected Routes
- `/checkout` - Checkout flow (requires login)
- `/orders` - Order history (requires login)
- `/admin` - Admin order management (requires admin role)

## 🔧 Key Components

### Core Components
- **Header**: Navigation with cart badge and user menu
- **Footer**: Site-wide footer with links and company info
- **ProductCard**: Reusable product display component
- **QuantitySelector**: Interactive quantity input
- **ProtectedRoute**: Route protection wrapper

### Context Providers
- **AuthContext**: User authentication state
- **CartContext**: Shopping cart state management

## 🎯 Demo Features

### Test User Accounts
- **Regular User**: `user@example.com` / `password123`
- **Admin User**: `admin@example.com` / `password123`

### Test Payment Information
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/28`)
- **CVV**: Any 3 digits (e.g., `123`)

## 🔐 Security Features

- Form validation with error handling
- Protected routes for authenticated users
- Admin-only access control
- Secure password input fields
- Input sanitization and validation

## 🎨 Design System

The app uses a comprehensive design system with:
- **Semantic Color Tokens**: Consistent color scheme across light/dark modes
- **Custom Variants**: E-commerce specific button and component variants
- **Responsive Grid**: Mobile-first responsive layouts
- **Animation**: Smooth transitions and hover effects

## 📊 Mock API Integration

The app includes a complete mock API that simulates:
- Product catalog management
- Shopping cart operations
- User authentication
- Order creation and tracking
- Admin functionality

## 🚀 Future Enhancements

- Real backend API integration
- Payment gateway integration (Stripe)
- Product reviews and ratings
- Wishlist functionality
- Advanced search and filtering
- Real-time order tracking
- Email notifications

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using React, TypeScript, and Tailwind CSS