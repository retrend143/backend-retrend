const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const auth = require("./middleware/auth");

// Global error handling
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error(err.name, err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});

const Product = require("./models/Product");
const authRoutes = require("./authRoutes/authRoutes");
const googleAuthRoutes = require("./authRoutes/googleAuthRoutes");
const phoneAuthRoutes = require("./authRoutes/phoneAuthRoutes");
const chatRoutes = require("./chatRoutes/chatRoutes");
const profileRoutes = require("./profileRoutes/profileRoutes");
const promotionRoutes = require("./profileRoutes/promotionRoutes");
const Wishlist = require("./models/Wishlist");

const axios = require('axios');
require('dotenv').config();

dotenv.config();

const app = express();

// ✅ Proper CORS Configuration
app.use(cors({ origin: "https://localhost:3000", credentials: true }));

app.use(bodyParser.json());

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to database!"))
  .catch((error) => {
    console.log("Connection failed!", error);
  });

// ✅ Routes
app.use("/", authRoutes);
app.use("/", googleAuthRoutes);
app.use("/", phoneAuthRoutes);
app.use("/", profileRoutes);
app.use("/", chatRoutes);
app.use("/", promotionRoutes);

// ✅ Add Product
app.post("/add_product", auth, async (req, res) => {
  try {
    console.log("==== ADD PRODUCT REQUEST RECEIVED ====");
    console.log("User email:", req.user.userEmail);
    console.log("Category:", req.body.catagory);
    console.log("Subcategory:", req.body.subcatagory);
    console.log("Title:", req.body.title);
    console.log("Received property data type:", typeof req.body.propertyData);
    console.log("Received property data stringified:", JSON.stringify(req.body.propertyData, null, 2));
    console.log("Received job data type:", typeof req.body.jobData);
    console.log("Received job data stringified:", JSON.stringify(req.body.jobData, null, 2));
    console.log("Received vehicle data type:", typeof req.body.vehicleData);
    console.log("Received vehicle data stringified:", JSON.stringify(req.body.vehicleData, null, 2));
    
    // Extra validation for property data
    let propertyData = req.body.propertyData;
    
    // Ensure propertyData is not undefined or null
    if (!propertyData) {
      console.log("Property data is missing, initializing empty object");
      propertyData = {};
    }
    
    // If it's a string, try to parse it
    if (typeof propertyData === 'string') {
      try {
        propertyData = JSON.parse(propertyData);
        console.log("Parsed property data from string:", propertyData);
      } catch (error) {
        console.error("Failed to parse propertyData string:", error);
        propertyData = {};
      }
    }
    
    // Final check to ensure it's a valid object
    if (typeof propertyData !== 'object' || Array.isArray(propertyData)) {
      console.error("Property data is not a valid object, type:", typeof propertyData);
      propertyData = {};
    }
    
    // Process job data the same way
    let jobData = req.body.jobData;
    console.log("Received job data type:", typeof jobData);
    console.log("Received job data stringified:", JSON.stringify(jobData, null, 2));
    
    // Ensure jobData is not undefined or null
    if (!jobData) {
      console.log("Job data is missing, initializing empty object");
      jobData = {};
    }
    
    // If it's a string, try to parse it
    if (typeof jobData === 'string') {
      try {
        jobData = JSON.parse(jobData);
        console.log("Parsed job data from string:", jobData);
      } catch (error) {
        console.error("Failed to parse jobData string:", error);
        jobData = {};
      }
    }
    
    // Final check to ensure it's a valid object
    if (typeof jobData !== 'object' || Array.isArray(jobData)) {
      console.error("Job data is not a valid object, type:", typeof jobData);
      jobData = {};
    }
    
    // For non-job categories, make sure we don't enforce job data validation
    if (req.body.catagory !== "Jobs" && !(req.body.subcatagory && req.body.subcatagory.toLowerCase().includes("job"))) {
      console.log("Non-job category detected, setting minimal job data");
      // For non-job categories, just set minimal required fields to pass validation
      jobData = {
        jobRole: req.body.title || "Product Title",
        jobCategory: req.body.subcatagory || "General",
        jobLocation: "",
        companyName: req.body.name || "",
        positionType: "Full-time",
        salaryPeriod: "Monthly",
        salaryFrom: "",
        salaryTo: "",
        educationRequired: "Any",
        experienceRequired: "Fresher",
        skills: "",
        openings: "1"
      };
    }
    // Only validate required job fields if it's a job listing
    else if (req.body.catagory === "Jobs" || (req.body.subcatagory && req.body.subcatagory.toLowerCase().includes("job"))) {
      if (!jobData.jobRole || !jobData.jobCategory) {
        // Populate required job data from product details
        jobData.jobRole = jobData.jobRole || req.body.title || '';
        jobData.jobCategory = jobData.jobCategory || req.body.subcatagory || '';
        
        // Extract location data more safely
        let locationText = '';
        if (req.body.address) {
          if (Array.isArray(req.body.address) && req.body.address.length > 0) {
            if (typeof req.body.address[0] === 'object') {
              locationText = `${req.body.address[0].city || ''}, ${req.body.address[0].state || ''}`.trim();
            } else if (typeof req.body.address[0] === 'string') {
              locationText = req.body.address[0];
            }
          } else if (typeof req.body.address === 'string') {
            locationText = req.body.address;
          }
        }
        
        jobData.jobLocation = jobData.jobLocation || locationText || '';
        jobData.companyName = jobData.companyName || req.body.name || '';
        jobData.salaryFrom = jobData.salaryFrom || req.body.price || '';
        
        console.log("Auto-populated job data for job listing:", jobData);
      }
    }
    
    // Create product with validated property and job data
    const product = new Product({
      useremail: req.user.userEmail,
      title: req.body.title,
      description: req.body.description,
      address: req.body.address,
      price: req.body.price,
      owner: req.body.name,
      ownerpicture: req.body.image,
      catagory: req.body.catagory,
      subcatagory: req.body.subcatagory,
      vehicleData: req.body.vehicleData,
      categoryData: req.body.categoryData,
      propertyData: propertyData, // Use the validated property data
      jobData: jobData, // Use the validated job data
    });

    for (let i = 0; i < req.body.uploadedFiles.length && i < 12; i++) {
      const fieldName = `productpic${i + 1}`;
      product[fieldName] = req.body.uploadedFiles[i];
    }

    console.log("Created product with property data type:", typeof product.propertyData);
    console.log("Created product with property data keys:", 
      Object.keys(product.propertyData || {}));
    console.log("Created product with property data stringified:", 
      JSON.stringify(product.propertyData, null, 2));
    
    // Save the product
    try {
      console.log("Attempting to save product...");
      const savedProduct = await product.save();
      console.log("Product saved successfully!");
      
      // Verify the property data after saving
      console.log("Saved product ID:", savedProduct._id.toString());
      console.log("Property data type in saved product:", typeof savedProduct.propertyData);
      console.log("Property data keys in saved product:", 
        Object.keys(savedProduct.propertyData || {}));
      console.log("Property data in saved product:", 
        JSON.stringify(savedProduct.propertyData, null, 2));
      
      // Return the product ID for confirmation
      res.status(200).json({
        message: "The product has been saved successfully.",
        productId: savedProduct._id.toString()
      });
    } catch (saveErr) {
      console.log("Error during product.save():", saveErr);
      console.log("Error type:", saveErr.name);
      console.log("Error message:", saveErr.message);
      if (saveErr.errors) {
        console.log("Validation errors:");
        Object.keys(saveErr.errors).forEach(field => {
          console.log(`Field ${field}:`, saveErr.errors[field].message);
        });
      }
      throw saveErr; // Re-throw to be caught by the outer catch block
    }
  } catch (err) {
    console.log("Error saving product:", err);
    // Add detailed error logging
    console.log("Error type:", err.name);
    console.log("Error message:", err.message);
    if (err.stack) {
      console.log("Error stack:", err.stack);
    }
    if (err.errors) {
      console.log("Validation errors:");
      for (const field in err.errors) {
        console.log(`Field ${field}:`, err.errors[field].message);
      }
    }
    
    res.status(500).json({
      error: "Failed to save the product.",
      details: err.message,
      validationErrors: err.errors ? Object.keys(err.errors).map(field => ({
        field,
        message: err.errors[field].message
      })) : null
    });
  }
});

// ✅ Get User's Ads
app.get("/myads_view", auth, async (req, res) => {
  try {
    const products = await Product.find({ useremail: req.user.userEmail });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ✅ Delete User's Ads
app.delete("/myads_delete/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      useremail: req.user.userEmail,
    });

    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }

    if (product.ownerpicture) {
      const publicId = product.ownerpicture.match(/\/v\d+\/(\S+)\.\w+/)[1];
      await cloudinary.uploader.destroy(publicId);
    }

    for (let i = 1; i <= 12; i++) {
      const productPic = `productpic${i}`;
      if (product[productPic]) {
        const publicId = product[productPic].match(/\/v\d+\/(\S+)\.\w+/)[1];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    res.send(product);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Server Error" });
  }
});

// ✅ Preview Ad (Logged-in Users)
app.post("/previewad/:id", auth, async (req, res) => {
  try {
    console.log("Finding product with ID:", req.params.id);
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log("Product not found with ID:", req.params.id);
      return res.status(404).send({ error: "Product not found" });
    }

    console.log("Preview ad - product found with ID:", req.params.id);
    console.log("Property data type in product:", typeof product.propertyData);
    console.log("Property data stringified in product:", 
      JSON.stringify(product.propertyData, null, 2));
    
    res.send({ product, own: product.useremail === req.user.userEmail });
  } catch (error) {
    console.error("Error in preview ad:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Preview Ad (Not Logged-in Users)
app.post("/previewad/notloggedin/:id", async (req, res) => {
  try {
    console.log("Finding product with ID (not logged in):", req.params.id);
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log("Product not found with ID (not logged in):", req.params.id);
      return res.status(404).send({ error: "Product not found" });
    }

    console.log("Preview ad (not logged in) - product found with ID:", req.params.id);
    console.log("Property data type in product:", typeof product.propertyData);
    console.log("Property data stringified in product:", 
      JSON.stringify(product.propertyData, null, 2));
    
    res.send({ product });
  } catch (error) {
    console.error("Error in preview ad (not logged in):", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get All Products
app.get("/getProducts", async (req, res) => {
  try {
    // Get current date to check for expired promotions
    const currentDate = new Date();
    
    // Find products with expired promotions and update them
    await Product.updateMany(
      { 
        isPromoted: true,
        promotionEndDate: { $lt: currentDate }
      },
      {
        $set: { isPromoted: false }
      }
    );
    
    // Get all products, sorting promoted ones first
    const products = await Product.find().sort({ isPromoted: -1, createdAt: -1 });
    res.status(200).send(products);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ✅ Get Products by Category
app.get("/getProductsbyCategory/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({
      $or: [{ catagory: category }, { subcatagory: category }],
    });
    res.status(200).send(products);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ✅ Search Products
app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const products = await Product.find({ title: { $regex: q, $options: "i" } });
    res.status(200).send(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get Products by Email
app.get("/getProductsbyemail", async (req, res) => {
  try {
    const { useremail } = req.query;
    const products = await Product.find({ useremail });
    res.status(200).send(products);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Update product promotion status (client-side only approach)
app.post("/update-promotion-status", auth, async (req, res) => {
  try {
    console.log("Updating promotion status for product:", req.body.productId);
    const { productId } = req.body;
    
    if (!productId) {
      console.error("Product ID is missing in the request");
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Check if product exists and belongs to the user
    const product = await Product.findOne({ 
      _id: productId,
      useremail: req.user.userEmail
    });
    
    if (!product) {
      console.error("Product not found or does not belong to user:", productId, req.user.userEmail);
      return res.status(404).json({ message: 'Product not found or you do not own this product' });
    }
    
    console.log("Found product:", product.title);
    
    // Update the product with promotion details
    const currentDate = new Date();
    const promotionEndDate = new Date();
    promotionEndDate.setDate(currentDate.getDate() + 30); // 30 days promotion
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        isPromoted: true,
        promotionStartDate: currentDate,
        promotionEndDate: promotionEndDate,
      },
      { new: true }
    );
    
    console.log("Product promotion status updated successfully:", updatedProduct.title);
    
    res.status(200).json({
      success: true,
      message: 'Product promotion status updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating promotion status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Add to Wishlist
app.post("/wishlist/add", auth, async (req, res) => {
  try {
    const { productId } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Check if already in wishlist
    const existingWishlistItem = await Wishlist.findOne({
      useremail: req.user.userEmail,
      productId
    });
    
    if (existingWishlistItem) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }
    
    // Create new wishlist entry
    const wishlistItem = new Wishlist({
      useremail: req.user.userEmail,
      productId
    });
    
    await wishlistItem.save();
    res.status(200).json({ message: "Added to wishlist successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all wishlist items for a user
app.get("/wishlist", auth, async (req, res) => {
  try {
    // Find all wishlist items for the user
    const wishlistItems = await Wishlist.find({
      useremail: req.user.userEmail
    }).populate('productId'); // This will populate the product details
    
    res.status(200).json(wishlistItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Check if a product is in the user's wishlist
app.get("/wishlist/check/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check if the product exists in the user's wishlist
    const wishlistItem = await Wishlist.findOne({
      useremail: req.user.userEmail,
      productId
    });
    
    res.status(200).json({ inWishlist: !!wishlistItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Remove from wishlist
app.delete("/wishlist/remove/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Delete the wishlist item
    await Wishlist.findOneAndDelete({
      useremail: req.user.userEmail,
      productId
    });
    
    res.status(200).json({ message: "Removed from wishlist successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update Product
app.post("/updateproduct/:id", auth, async (req, res) => {
  try {
    console.log("Attempting to update product:", req.params.id);
    console.log("Update data received:", JSON.stringify(req.body, null, 2));
    
    // Validate the product belongs to the user
    const product = await Product.findOne({
      _id: req.params.id,
      useremail: req.user.userEmail
    });
    
    if (!product) {
      console.error("Product not found or does not belong to user");
      return res.status(404).json({ message: 'Product not found or you do not own this product' });
    }
    
    // Process job data if provided
    if (req.body.jobData) {
      console.log("Processing job data update:", typeof req.body.jobData);
      console.log("Job data content:", JSON.stringify(req.body.jobData, null, 2));
      
      let jobData = req.body.jobData;
      
      // If it's a string, try to parse it
      if (typeof jobData === 'string') {
        try {
          jobData = JSON.parse(jobData);
          console.log("Parsed job data from string:", jobData);
        } catch (error) {
          console.error("Failed to parse jobData string:", error);
          return res.status(400).json({ message: 'Invalid job data format' });
        }
      }
      
      // Final check to ensure it's a valid object
      if (typeof jobData !== 'object' || Array.isArray(jobData)) {
        console.error("Job data is not a valid object, type:", typeof jobData);
        return res.status(400).json({ message: 'Invalid job data format' });
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
          sanitizedJobData[field] = String(jobData[field] || '');
        } else {
          // Set default values for missing fields
          switch (field) {
            case 'positionType':
              sanitizedJobData[field] = 'Full-time';
              break;
            case 'salaryPeriod':
              sanitizedJobData[field] = 'Monthly';
              break;
            case 'educationRequired':
              sanitizedJobData[field] = 'Any';
              break;
            case 'experienceRequired':
              sanitizedJobData[field] = 'Fresher';
              break;
            case 'openings':
              sanitizedJobData[field] = '1';
              break;
            default:
              sanitizedJobData[field] = '';
          }
        }
      });
      
      // If job role or category is missing, populate from product data
      if (!sanitizedJobData.jobRole) sanitizedJobData.jobRole = product.title || '';
      if (!sanitizedJobData.jobCategory) sanitizedJobData.jobCategory = product.subcatagory || '';
      if (!sanitizedJobData.companyName) sanitizedJobData.companyName = product.owner || '';
      if (!sanitizedJobData.salaryFrom && product.price) sanitizedJobData.salaryFrom = product.price;
      
      // Check if this is specifically a job posting
      if (product.catagory === "Jobs" || (product.subcatagory && product.subcatagory.toLowerCase().includes("job"))) {
        // Ensure required fields are present for job postings
        if (!sanitizedJobData.jobRole) {
          sanitizedJobData.jobRole = product.title || "Job Title";
        }
        if (!sanitizedJobData.jobCategory) {
          sanitizedJobData.jobCategory = product.subcatagory || "Data entry & Back office";
        }
        if (!sanitizedJobData.jobLocation) {
          sanitizedJobData.jobLocation = (product.address && product.address[0] && typeof product.address[0] === 'object')
            ? `${product.address[0].city || ""}, ${product.address[0].state || ""}` 
            : "";
        }
      }
      
      console.log("Final sanitized job data:", sanitizedJobData);
      
      // Update product with new job data
      product.jobData = sanitizedJobData;
      console.log("Job data updated:", sanitizedJobData);
    }
    
    // Update other fields if provided
    if (req.body.title) product.title = req.body.title;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price) product.price = req.body.price;
    if (req.body.address) product.address = req.body.address;
    if (req.body.propertyData) product.propertyData = req.body.propertyData;
    if (req.body.vehicleData) product.vehicleData = req.body.vehicleData;
    if (req.body.categoryData) product.categoryData = req.body.categoryData;
    
    // Save the updated product
    await product.save();
    console.log("Product updated successfully:", product._id);
    
    res.status(200).json({
      message: 'Product updated successfully',
      product: {
        id: product._id,
        title: product.title,
        description: product.description,
        price: product.price,
        jobData: product.jobData
      }
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}!`));

// Diagnostic endpoint to check raw product data
app.get("/debug/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Return the raw product document
    const rawProduct = product.toObject();
    
    // Add specific diagnostics
    const diagnostics = {
      propertyDataExists: !!rawProduct.propertyData,
      propertyDataType: typeof rawProduct.propertyData,
      propertyDataKeys: rawProduct.propertyData ? Object.keys(rawProduct.propertyData) : [],
      propertyDataStringified: rawProduct.propertyData ? JSON.stringify(rawProduct.propertyData) : null,
      databaseId: rawProduct._id.toString()
    };
    
    res.json({
      diagnostics,
      rawProduct
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

// Modify the existing /moderate-image route
app.post('/moderate-image', async (req, res) => {
  try {
    const { image } = req.body;
    const response = await axios.post('https://api.openai.com/v1/moderations', {
      image
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const moderationResult = response.data;
    console.log("Moderation response:", moderationResult);

    if (!moderationResult || typeof moderationResult.isAppropriate === 'undefined') {
      console.error("Invalid moderation response structure:", moderationResult);
      return res.status(500).json({ error: "Unexpected moderation response" });
    }

    res.status(200).json({
      isAppropriate: moderationResult.isAppropriate,
      moderationDetails: moderationResult
    });
  } catch (error) {
    console.error('Error moderating image:', error);
    res.status(500).json({ error: 'Server error during image moderation' });
  }
});
