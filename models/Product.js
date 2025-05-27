const mongoose = require("mongoose");

// Define a specific schema for property data
const PropertyDataSchema = new mongoose.Schema({
  propertyType: String,
  bhk: String,
  bathrooms: String,
  furnishing: String,
  projectStatus: String,
  listedBy: String,
  superBuiltupArea: String,
  carpetArea: String,
  maintenance: String,
  totalFloors: String,
  floorNo: String,
  carParking: String,
  facing: String,
  projectName: String,
  age: String,
  balconies: String,
  amenities: {
    lift: Boolean,
    powerBackup: Boolean,
    security: Boolean,
    garden: Boolean,
    clubhouse: Boolean,
    swimmingPool: Boolean,
    gym: Boolean,
    waterSupply: Boolean
  }
}, { _id: false });

// Add this before the ProductSchema definition
const JobDataSchema = new mongoose.Schema({
  jobRole: {
    type: String,
    default: function() {
      // Get title from parent document or default to empty string
      return this.parent().title || '';
    }
  },
  jobCategory: {
    type: String,
    default: function() {
      // Get subcategory from parent document or default to empty string
      return this.parent().subcatagory || '';
    }
  },
  companyName: {
    type: String,
    default: function() {
      // Get owner name from parent document or default to empty string
      return this.parent().owner || '';
    }
  },
  positionType: {
    type: String,
    default: 'Full-time',
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary']
  },
  salaryPeriod: {
    type: String,
    default: 'Monthly',
    enum: ['Monthly', 'Yearly', 'Hourly', 'Weekly']
  },
  salaryFrom: {
    type: String,
    default: ''
  },
  salaryTo: {
    type: String,
    default: ''
  },
  educationRequired: {
    type: String,
    default: 'Any',
    enum: ['Any', '10th Pass', '12th Pass', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Professional Certification']
  },
  experienceRequired: {
    type: String,
    default: 'Fresher',
    enum: ['Fresher', '0-1 Years', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years']
  },
  jobLocation: {
    type: String,
    default: ''
  },
  skills: {
    type: String,
    default: ''
  },
  openings: {
    type: String,
    default: '1'
  }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  useremail: {
    type: String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  address: {
    type: Array,
  },
  price: {
    type: String,
  },
  productpic1: {
    type: String,
  },
  productpic2: {
    type: String,
  },
  productpic3: {
    type: String,
  },
  productpic4: {
    type: String,
  },
  productpic5: {
    type: String,
  },
  productpic6: {
    type: String,
  },
  productpic7: {
    type: String,
  },
  productpic8: {
    type: String,
  },
  productpic9: {
    type: String,
  },
  productpic10: {
    type: String,
  },
  productpic11: {
    type: String,
  },
  productpic12: {
    type: String,
  },
  owner: {
    type: String,
  },
  ownerpicture: {
    type: String,
  },
  catagory: {
    type: String,
    required: true,
  },
  subcatagory: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Set the default value to the current date and time
  },
  isPromoted: {
    type: Boolean,
    default: false,
  },
  promotionStartDate: {
    type: Date,
  },
  promotionEndDate: {
    type: Date,
  },
  promotionPaymentId: {
    type: String,
  },
  promotionOrderId: {
    type: String,
  },
  vehicleData: {
    type: Object,  // Using Object type to store nested vehicle properties
  },
  categoryData: {
    type: Object,  // Using Object type to store nested category-specific properties
  },
  propertyData: {
    type: PropertyDataSchema,  // Using our defined schema instead of generic Object
  },
  jobData: {
    type: JobDataSchema,
    default: () => ({})
  },
});

// Add toJSON method to ensure property data is correctly serialized
ProductSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    // If property data is missing, initialize it
    if (!ret.propertyData) {
      ret.propertyData = {};
    }
    
    // Ensure we have the correct property data structure even if MongoDB returns it in a strange format
    if (ret.propertyData && typeof ret.propertyData === 'string') {
      try {
        ret.propertyData = JSON.parse(ret.propertyData);
        console.log('Parsed propertyData from string to object');
      } catch (e) {
        console.error('Failed to parse propertyData string:', e);
        ret.propertyData = {}; // Fallback to empty object
      }
    }
    
    return ret;
  }
});

// Pre-save middleware to ensure property data is properly formatted
ProductSchema.pre('save', function(next) {
  // Log the property data before saving
  console.log('Pre-save propertyData type:', typeof this.propertyData);
  console.log('Pre-save propertyData:', this.propertyData);
  
  // If property data is a string, try to parse it
  if (this.propertyData && typeof this.propertyData === 'string') {
    try {
      this.propertyData = JSON.parse(this.propertyData);
      console.log('Parsed propertyData from string to object before saving');
    } catch (e) {
      console.error('Failed to parse propertyData string before saving:', e);
      this.propertyData = {}; // Fallback to empty object
    }
  }
  
  // Ensure job data has required fields
  if (this.jobData) {
    console.log('Pre-save jobData:', this.jobData);
    
    // Ensure job data has the required fields to pass validation
    if (!this.jobData.jobRole) {
      console.log('Setting default jobRole value');
      this.jobData.jobRole = this.title || 'Product';
    }
    
    if (!this.jobData.jobCategory) {
      console.log('Setting default jobCategory value');
      this.jobData.jobCategory = this.subcatagory || 'General';
    }
  } else {
    // Initialize with empty object if missing
    console.log('Initializing empty jobData');
    this.jobData = {
      jobRole: this.title || 'Product',
      jobCategory: this.subcatagory || 'General'
    };
  }
  
  next();
});

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
