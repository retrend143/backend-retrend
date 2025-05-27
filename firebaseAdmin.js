const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Initialize Firebase Admin
try {
  // Try to use the service account key file
  let serviceAccount;
  try {
    serviceAccount = require('./service-account-key.json');
  } catch (fileError) {
    console.error('Error loading service account file:', fileError.message);
    // If the file can't be loaded, create a minimal service account object
    serviceAccount = {
      "type": "service_account",
      "project_id": "raji-7ce4c",
      // Other fields will be missing, but at least we have the project ID
    };
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "raji-7ce4c" // Explicitly set the project ID
  });
  
  console.log('Firebase Admin SDK initialized successfully with project ID:', serviceAccount.project_id);
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  
  // Last resort - try with just the project ID
  try {
    admin.initializeApp({
      projectId: "raji-7ce4c"
    });
    console.log('Firebase Admin SDK initialized with project ID only');
  } catch (fallbackError) {
    console.error('Failed to initialize with project ID only:', fallbackError);
    throw new Error('Could not initialize Firebase Admin SDK');
  }
}

module.exports = admin; 