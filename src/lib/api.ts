import axios from 'axios';
import type { Product, Cart, Order, User, RegisterData, Address, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock API responses for development
const mockDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    await mockDelay();
    // Mock successful login
    const mockUser: User = {
      id: '1',
      email,
      firstName: 'John',
      lastName: 'Doe',
      isAdmin: email.includes('admin'),
      createdAt: new Date().toISOString(),
    };
    const token = 'mock-jwt-token-' + Date.now();
    return { success: true, data: { user: mockUser, token } };
  },

  register: async (userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> => {
    await mockDelay();
    const mockUser: User = {
      id: '2',
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    const token = 'mock-jwt-token-' + Date.now();
    return { success: true, data: { user: mockUser, token } };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    await mockDelay();
    return { success: true };
  },
};

// Products API
export const productsAPI = {
  getAll: async (search?: string, category?: string): Promise<ApiResponse<Product[]>> => {
    await mockDelay();
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 299.99,
        salePrice: 249.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        category: 'electronics',
        inStock: true,
        stockCount: 15,
        rating: 4.5,
        reviewCount: 128,
      },
      {
        id: '2',
        name: 'Smart Fitness Watch',
        description: 'Track your fitness goals with this advanced smartwatch',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        category: 'electronics',
        inStock: true,
        stockCount: 8,
        rating: 4.2,
        reviewCount: 89,
      },
      {
        id: '3',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt',
        price: 29.99,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        category: 'clothing',
        inStock: true,
        stockCount: 25,
        rating: 4.0,
        reviewCount: 56,
      }
    ];
    
    let filtered = mockProducts;
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }
    
    return { success: true, data: filtered };
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    await mockDelay();
    const products = await productsAPI.getAll();
    const product = products.data?.find(p => p.id === id);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    return { success: true, data: product };
  },
};

// Cart API
export const cartAPI = {
  get: async (): Promise<ApiResponse<Cart>> => {
    await mockDelay();
    const cartData = localStorage.getItem('cart');
    const cart: Cart = cartData ? JSON.parse(cartData) : {
      id: '1',
      items: [],
      subtotal: 0,
      total: 0,
      itemCount: 0,
    };
    return { success: true, data: cart };
  },

  addItem: async (productId: string, quantity: number = 1): Promise<ApiResponse<Cart>> => {
    await mockDelay();
    const productResponse = await productsAPI.getById(productId);
    if (!productResponse.success || !productResponse.data) {
      return { success: false, error: 'Product not found' };
    }

    const cartResponse = await cartAPI.get();
    const cart = cartResponse.data!;
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        id: `item-${Date.now()}`,
        productId,
        product: productResponse.data,
        quantity,
        price: productResponse.data.salePrice || productResponse.data.price,
      });
    }

    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.total = cart.subtotal;
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    localStorage.setItem('cart', JSON.stringify(cart));
    return { success: true, data: cart };
  },

  updateItem: async (itemId: string, quantity: number): Promise<ApiResponse<Cart>> => {
    await mockDelay();
    const cartResponse = await cartAPI.get();
    const cart = cartResponse.data!;
    const item = cart.items.find(item => item.id === itemId);

    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    if (quantity <= 0) {
      return cartAPI.removeItem(itemId);
    }

    item.quantity = quantity;
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.total = cart.subtotal;
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    localStorage.setItem('cart', JSON.stringify(cart));
    return { success: true, data: cart };
  },

  removeItem: async (itemId: string): Promise<ApiResponse<Cart>> => {
    await mockDelay();
    const cartResponse = await cartAPI.get();
    const cart = cartResponse.data!;
    
    cart.items = cart.items.filter(item => item.id !== itemId);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.total = cart.subtotal;
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    localStorage.setItem('cart', JSON.stringify(cart));
    return { success: true, data: cart };
  },

  clear: async (): Promise<ApiResponse<Cart>> => {
    await mockDelay();
    const cart: Cart = {
      id: '1',
      items: [],
      subtotal: 0,
      total: 0,
      itemCount: 0,
    };
    localStorage.setItem('cart', JSON.stringify(cart));
    return { success: true, data: cart };
  },
};

// Orders API
export const ordersAPI = {
  create: async (orderData: {
    shippingAddress: Address;
    billingAddress: Address;
  }): Promise<ApiResponse<Order>> => {
    await mockDelay();
    const cartResponse = await cartAPI.get();
    const cart = cartResponse.data!;

    const order: Order = {
      id: `order-${Date.now()}`,
      userId: '1',
      items: cart.items,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      subtotal: cart.subtotal,
      tax: cart.subtotal * 0.08,
      shipping: cart.subtotal > 100 ? 0 : 9.99,
      total: cart.subtotal + (cart.subtotal * 0.08) + (cart.subtotal > 100 ? 0 : 9.99),
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Clear cart after order
    await cartAPI.clear();

    return { success: true, data: order };
  },

  getByUserId: async (userId: string): Promise<ApiResponse<Order[]>> => {
    await mockDelay();
    const mockOrders: Order[] = [
      {
        id: 'order-1',
        userId,
        items: [],
        shippingAddress: {} as Address,
        billingAddress: {} as Address,
        subtotal: 299.99,
        tax: 24.00,
        shipping: 0,
        total: 323.99,
        status: 'delivered',
        paymentStatus: 'paid',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-18T14:30:00Z',
      },
    ];
    return { success: true, data: mockOrders };
  },

  getAll: async (): Promise<ApiResponse<Order[]>> => {
    await mockDelay();
    return { success: true, data: [] };
  },
};