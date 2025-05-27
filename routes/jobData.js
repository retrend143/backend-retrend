const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

/**
 * Updates job data for an existing product
 * @route POST /update_job_data
 * @access Private
 */
router.post('/update_job_data', auth, async (req, res) => {
  try {
    const { productId, jobData } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Validate job data against the schema
    const validJobDataFields = [
      'jobRole', 'jobCategory', 'companyName', 'positionType', 
      'salaryPeriod', 'salaryFrom', 'salaryTo', 'educationRequired', 
      'experienceRequired', 'jobLocation', 'skills', 'openings'
    ];

    // Filter and sanitize job data
    const sanitizedJobData = {};
    validJobDataFields.forEach(field => {
      if (jobData[field] !== undefined) {
        sanitizedJobData[field] = jobData[field] || '';
      }
    });

    // Get user ID from auth middleware
    const userId = req.user.id;

    // Find the product
    const product = await Product.findById(productId);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product or is admin
    if (product.useremail !== req.user.email && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    console.log('Updating job data for product:', productId);
    console.log('Sanitized job data:', sanitizedJobData);

    // Update the job data
    product.jobData = sanitizedJobData;
    
    // Save the product
    await product.save();

    return res.status(200).json({ 
      message: 'Job data updated successfully',
      product: {
        id: product._id,
        title: product.title,
        jobData: product.jobData
      }
    });
  } catch (error) {
    console.error('Error updating job data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 