const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
  createPaymentIntent,
  retrievePaymentIntent,
  calculateTax,
  calculateShipping,
  validateWebhookSignature
} = require('../utils/stripe');

/**
 * Create checkout session and PaymentIntent
 * POST /api/checkout
 */
const checkout = asyncHandler(async (req, res) => {
  const { shippingAddress, shippingMethod = 'standard' } = req.body;

  // Authentication required for checkout
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for checkout'
    });
  }

  // Get user's cart
  const cart = await Cart.findOne({ userId: req.user._id, status: 'active' })
    .populate('items.productId');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  // Validate cart items and check stock
  const invalidItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    if (!item.productId || !item.productId.isActive) {
      invalidItems.push(`${item.productId?.name || 'Unknown product'} is no longer available`);
      continue;
    }

    if (item.productId.stock < item.quantity) {
      if (item.productId.stock === 0) {
        invalidItems.push(`${item.productId.name} is out of stock`);
      } else {
        invalidItems.push(`Only ${item.productId.stock} ${item.productId.name} available, but ${item.quantity} requested`);
      }
      continue;
    }

    subtotal += item.productId.price * item.quantity;
  }

  if (invalidItems.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Some items in your cart are no longer available',
      errors: invalidItems
    });
  }

  // Calculate costs
  const tax = calculateTax(subtotal, shippingAddress);
  const shippingCost = calculateShipping(shippingMethod, subtotal, cart.totalItems);
  const totalPrice = subtotal + tax + shippingCost;

  // Create Stripe PaymentIntent
  const paymentIntent = await createPaymentIntent(
    totalPrice,
    'usd',
    {
      userId: req.user._id.toString(),
      cartId: cart._id.toString(),
      customerEmail: req.user.email,
      itemCount: cart.totalItems.toString()
    }
  );

  res.status(200).json({
    success: true,
    message: 'Checkout session created successfully',
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderSummary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        total: parseFloat(totalPrice.toFixed(2)),
        currency: 'usd',
        items: cart.items.map(item => ({
          productId: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity,
          subtotal: item.productId.price * item.quantity
        }))
      }
    }
  });
});

/**
 * Confirm order after successful payment
 * POST /api/orders/confirm
 */
const confirmOrder = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Retrieve PaymentIntent from Stripe
  const paymentIntent = await retrievePaymentIntent(paymentIntentId);

  if (!paymentIntent || paymentIntent.status !== 'succeeded') {
    return res.status(400).json({
      success: false,
      message: 'Payment not completed or invalid'
    });
  }

  // Verify the payment belongs to this user
  if (paymentIntent.metadata.userId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized payment confirmation'
    });
  }

  // Get user's cart
  const cart = await Cart.findById(paymentIntent.metadata.cartId)
    .populate('items.productId');

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  // Check if order already exists
  const existingOrder = await Order.findOne({ paymentIntentId });
  if (existingOrder) {
    return res.status(200).json({
      success: true,
      message: 'Order already confirmed',
      data: { order: existingOrder }
    });
  }

  // Calculate order totals
  let subtotal = 0;
  const orderItems = [];

  for (const cartItem of cart.items) {
    if (!cartItem.productId || !cartItem.productId.isActive) {
      continue; // Skip inactive products
    }

    // Update product stock
    await cartItem.productId.updateStock(cartItem.quantity);

    // Prepare order item
    orderItems.push({
      productId: cartItem.productId._id,
      name: cartItem.productId.name,
      price: cartItem.productId.price,
      quantity: cartItem.quantity,
      imageUrl: cartItem.productId.imageUrl,
      category: cartItem.productId.category,
      brand: cartItem.productId.brand,
      sku: cartItem.productId.sku
    });

    subtotal += cartItem.productId.price * cartItem.quantity;
  }

  // Calculate final amounts (should match PaymentIntent amount)
  const tax = calculateTax(subtotal, req.body.shippingAddress || {});
  const shippingCost = calculateShipping(
    req.body.shippingMethod || 'standard', 
    subtotal, 
    cart.totalItems
  );
  const totalPrice = subtotal + tax + shippingCost;

  // Create order
  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    subtotal,
    tax,
    shippingCost,
    totalPrice,
    shippingAddress: req.body.shippingAddress,
    paymentIntentId,
    paymentStatus: 'succeeded',
    orderStatus: 'confirmed',
    shippingMethod: req.body.shippingMethod || 'standard',
    paidAt: new Date()
  });

  // Clear the cart
  await cart.clearCart();

  res.status(201).json({
    success: true,
    message: 'Order confirmed successfully',
    data: { order }
  });
});

/**
 * Get user's orders
 * GET /api/orders/my
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const orders = await Order.findByUser(req.user._id, {
    limit: limitNum,
    sort: { orderDate: -1 }
  }).skip((pageNum - 1) * limitNum);

  const totalOrders = await Order.countDocuments({ userId: req.user._id });
  const totalPages = Math.ceil(totalOrders / limitNum);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalOrders,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      }
    }
  });
});

/**
 * Get single order by ID
 * GET /api/orders/:id
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name email');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user owns this order or is admin
  if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.status(200).json({
    success: true,
    data: { order }
  });
});

/**
 * Cancel order (if possible)
 * PATCH /api/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user owns this order or is admin
  if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if order can be cancelled
  if (!order.canBeCancelled) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  // Update order status
  await order.updateStatus('cancelled', 'Cancelled by customer request');

  // Restore product stock
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      await product.restoreStock(item.quantity);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order }
  });
});

// ========== ADMIN ONLY ROUTES ==========

/**
 * Get all orders (Admin only)
 * GET /api/orders
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    startDate,
    endDate,
    sortBy = 'orderDate',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};
  if (status) query.orderStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (startDate || endDate) {
    query.orderDate = {};
    if (startDate) query.orderDate.$gte = new Date(startDate);
    if (endDate) query.orderDate.$lte = new Date(endDate);
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalOrders / limitNum);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalOrders,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      }
    }
  });
});

/**
 * Update order status (Admin only)
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  await order.updateStatus(status, notes);

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: { order }
  });
});

/**
 * Add tracking information (Admin only)
 * PATCH /api/orders/:id/tracking
 */
const addTracking = asyncHandler(async (req, res) => {
  const { trackingNumber, carrier } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  await order.addTracking(trackingNumber, carrier);

  res.status(200).json({
    success: true,
    message: 'Tracking information added successfully',
    data: { order }
  });
});

/**
 * Get order statistics (Admin only)
 * GET /api/orders/admin/stats
 */
const getOrderStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const stats = await Order.getStatistics(start, end);

  res.status(200).json({
    success: true,
    data: { stats }
  });
});

/**
 * Handle Stripe webhooks
 * POST /api/orders/webhook
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  try {
    event = validateWebhookSignature(req.body, signature);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Webhook signature verification failed'
    });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Payment succeeded:', paymentIntent.id);
      
      // Update order payment status
      const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
      if (order) {
        await order.updatePaymentStatus('succeeded');
      }
      break;

    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed:', event.data.object.id);
      
      // Update order payment status
      const failedOrder = await Order.findOne({ paymentIntentId: event.data.object.id });
      if (failedOrder) {
        await failedOrder.updatePaymentStatus('failed');
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
});

module.exports = {
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
};