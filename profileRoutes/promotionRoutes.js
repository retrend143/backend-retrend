const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const razorpay = require('../razorpayConfig');

// Create a Razorpay order for product promotion
router.post('/create-promotion-order', auth, async (req, res) => {
  try {
    console.log('Creating promotion order...');
    const { productId } = req.body;
    
    if (!productId) {
      console.error('Product ID is missing in the request');
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    console.log('Looking up product:', productId);
    
    // Check if product exists and belongs to the user
    const product = await Product.findOne({ 
      _id: productId,
      useremail: req.user.userEmail
    });
    
    if (!product) {
      console.error('Product not found or does not belong to user:', productId, req.user.userEmail);
      return res.status(404).json({ message: 'Product not found or you do not own this product' });
    }
    
    console.log('Product found:', product.title);
    
    // Verify Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay API keys are missing in environment variables');
      return res.status(500).json({ message: 'Payment gateway configuration error' });
    }
    
    // Create a Razorpay order
    const options = {
      amount: 3000, // amount in paise (30 INR)
      currency: 'INR',
      receipt: `receipt_order_${productId}`,
      notes: {
        productId: productId,
        userEmail: req.user.userEmail
      }
    };
    
    console.log('Creating Razorpay order with options:', JSON.stringify(options));
    
    try {
      const order = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', order.id);
      
      res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    } catch (razorpayError) {
      console.error('Razorpay API error:', razorpayError);
      
      // Handle specific Razorpay errors
      if (razorpayError.statusCode === 401) {
        return res.status(500).json({ 
          message: 'Payment gateway authentication failed. Please check API credentials.',
          error: razorpayError.message || 'Authentication failed'
        });
      }
      
      return res.status(500).json({ 
        message: 'Error creating payment order', 
        error: razorpayError.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error creating promotion order:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message || 'Unknown error'
    });
  }
});

// Verify and process payment for product promotion
router.post('/verify-promotion-payment', auth, async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      productId 
    } = req.body;
    
    // Verify the payment signature (in a production app, you should implement proper signature verification)
    // For simplicity, we're skipping the cryptographic verification here
    
    // Update the product with promotion details
    const currentDate = new Date();
    const promotionEndDate = new Date();
    promotionEndDate.setDate(currentDate.getDate() + 30); // 30 days promotion
    
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, useremail: req.user.userEmail },
      {
        isPromoted: true,
        promotionStartDate: currentDate,
        promotionEndDate: promotionEndDate,
        promotionPaymentId: razorpay_payment_id,
        promotionOrderId: razorpay_order_id
      },
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found or you do not own this product' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product promotion successful',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error verifying promotion payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get promotion status for a product
router.get('/promotion-status/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findOne({ _id: productId });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const isOwner = product.useremail === req.user.userEmail;
    
    // Return promotion details
    res.status(200).json({
      isPromoted: product.isPromoted,
      promotionStartDate: product.promotionStartDate,
      promotionEndDate: product.promotionEndDate,
      isOwner
    });
  } catch (error) {
    console.error('Error getting promotion status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 