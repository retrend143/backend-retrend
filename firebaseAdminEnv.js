const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin using environment variables
try {
  // Check if we have the required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || "raji-7ce4c";
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? 
    process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  if (privateKey && clientEmail) {
    // Initialize with environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        privateKey: privateKey,
        clientEmail: clientEmail,
      }),
    });
    console.log('Firebase Admin SDK initialized with environment variables');
  } else {
    // Fall back to the service account file
    try {
      const serviceAccount = require('./service-account-key.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized with service account file');
    } catch (fileError) {
      console.error('Error loading service account file:', fileError.message);
      // Initialize with just the project ID as a last resort
      admin.initializeApp({
        projectId: projectId
      });
      console.log('Firebase Admin SDK initialized with project ID only');
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  throw new Error('Could not initialize Firebase Admin SDK');
}

module.exports = admin; 