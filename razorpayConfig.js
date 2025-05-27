const Razorpay = require('razorpay');
const dotenv = require('dotenv');

dotenv.config();

// Check if Razorpay API keys are available
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

// Log key status
console.log('Razorpay Key ID available:', !!key_id);
console.log('Razorpay Key Secret available:', !!key_secret);

if (!key_id) {
  console.error('ERROR: Razorpay Key ID is missing in environment variables');
  console.error('Please set RAZORPAY_KEY_ID in your .env file');
}

if (!key_secret) {
  console.error('WARNING: Razorpay Key Secret is missing in environment variables');
  console.error('You can still use the frontend integration with just the Key ID, but server-side operations will fail');
  console.error('Please set RAZORPAY_KEY_SECRET in your .env file for full functionality');
}

console.log('Initializing Razorpay with key_id:', key_id ? key_id.substring(0, 8) + '...' : 'undefined');

// Initialize Razorpay with available keys
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: key_id,
    key_secret: key_secret || 'dummy_secret_for_frontend_only',
  });
  console.log('Razorpay initialized successfully');
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);
  // Create a mock Razorpay instance that logs errors
  razorpay = {
    orders: {
      create: () => {
        throw new Error('Razorpay not properly initialized. Check your API keys.');
      }
    }
  };
}

module.exports = razorpay;