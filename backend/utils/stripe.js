const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe PaymentIntent
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code (default: usd)
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - PaymentIntent object
 */
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      payment_method_types: ['card'],
      capture_method: 'automatic', // Automatically capture payment
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe PaymentIntent creation error:', error);
    throw new Error(`Payment processing error: ${error.message}`);
  }
};

/**
 * Retrieve PaymentIntent
 * @param {string} paymentIntentId - PaymentIntent ID
 * @returns {Promise<Object>} - PaymentIntent object
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe PaymentIntent retrieval error:', error);
    throw new Error(`Failed to retrieve payment: ${error.message}`);
  }
};

/**
 * Update PaymentIntent metadata
 * @param {string} paymentIntentId - PaymentIntent ID
 * @param {Object} metadata - Metadata to update
 * @returns {Promise<Object>} - Updated PaymentIntent object
 */
const updatePaymentIntent = async (paymentIntentId, metadata) => {
  try {
    const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
      metadata
    });
    return paymentIntent;
  } catch (error) {
    console.error('Stripe PaymentIntent update error:', error);
    throw new Error(`Failed to update payment: ${error.message}`);
  }
};

/**
 * Cancel PaymentIntent
 * @param {string} paymentIntentId - PaymentIntent ID
 * @returns {Promise<Object>} - Cancelled PaymentIntent object
 */
const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe PaymentIntent cancellation error:', error);
    throw new Error(`Failed to cancel payment: ${error.message}`);
  }
};

/**
 * Create refund
 * @param {string} paymentIntentId - PaymentIntent ID
 * @param {number} amount - Amount to refund in cents (optional, defaults to full amount)
 * @param {string} reason - Reason for refund
 * @returns {Promise<Object>} - Refund object
 */
const createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundData = {
      payment_intent: paymentIntentId,
      reason
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Stripe refund creation error:', error);
    throw new Error(`Failed to create refund: ${error.message}`);
  }
};

/**
 * Calculate tax amount (simple implementation - in production, use a tax service)
 * @param {number} subtotal - Subtotal amount
 * @param {Object} address - Shipping address
 * @returns {number} - Tax amount
 */
const calculateTax = (subtotal, address) => {
  // Simple tax calculation - in production, integrate with a tax service like TaxJar
  const taxRates = {
    'CA': 0.0875, // California
    'NY': 0.08,   // New York
    'TX': 0.0625, // Texas
    'FL': 0.06,   // Florida
    'WA': 0.065,  // Washington
  };

  const taxRate = taxRates[address.state] || 0.05; // Default 5% tax
  return subtotal * taxRate;
};

/**
 * Calculate shipping cost based on method and total
 * @param {string} method - Shipping method
 * @param {number} subtotal - Subtotal amount
 * @param {number} totalItems - Total number of items
 * @returns {number} - Shipping cost
 */
const calculateShipping = (method = 'standard', subtotal, totalItems) => {
  // Free shipping over $50
  if (subtotal >= 50) {
    return 0;
  }

  const shippingRates = {
    'standard': 5.99,
    'express': 12.99,
    'overnight': 24.99
  };

  const baseRate = shippingRates[method] || shippingRates.standard;
  
  // Add extra cost for heavy orders
  const extraItemFee = Math.max(0, (totalItems - 3) * 1.50);
  
  return baseRate + extraItemFee;
};

/**
 * Validate webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} - Parsed event object
 */
const validateWebhookSignature = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    throw new Error('Invalid webhook signature');
  }
};

/**
 * Format amount for display
 * @param {number} amountInCents - Amount in cents
 * @param {string} currency - Currency code
 * @returns {string} - Formatted amount
 */
const formatAmount = (amountInCents, currency = 'usd') => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
};

/**
 * Convert amount to cents
 * @param {number} amount - Amount in dollars
 * @returns {number} - Amount in cents
 */
const toCents = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Convert amount from cents to dollars
 * @param {number} amountInCents - Amount in cents
 * @returns {number} - Amount in dollars
 */
const fromCents = (amountInCents) => {
  return amountInCents / 100;
};

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  updatePaymentIntent,
  cancelPaymentIntent,
  createRefund,
  calculateTax,
  calculateShipping,
  validateWebhookSignature,
  formatAmount,
  toCents,
  fromCents
};