# Detailed Firebase Service Account Setup

This guide provides step-by-step instructions to properly set up Firebase Authentication with a service account key.

## 1. Generate a Service Account Key (with screenshots)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (raji-7ce4c)
3. Click on the gear icon (⚙️) next to "Project Overview" and select "Project settings"
4. Go to the "Service accounts" tab
5. Make sure "Firebase Admin SDK" is selected
6. Click on "Generate new private key" button
7. In the popup, click "Generate key"
8. Save the JSON file to your computer

## 2. Set up the Service Account Key

1. Rename the downloaded JSON file to `service-account-key.json`
2. Place it in your server directory (the same directory as firebaseAdmin.js)
3. Make sure the file contains all the required fields:
   - type
   - project_id
   - private_key_id
   - private_key
   - client_email
   - client_id
   - auth_uri
   - token_uri
   - auth_provider_x509_cert_url
   - client_x509_cert_url

## 3. Verify the Service Account Key Format

The private_key field in your service account key should look something like this:
```
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEF...long string with \n characters...-----END PRIVATE KEY-----\n"
```

Make sure the newline characters (`\n`) are preserved.

## 4. Alternative: Set up Environment Variables

If you prefer not to store the service account key as a file:

1. Create a `.env` file in the server directory
2. Add the following environment variables:
```
FIREBASE_PROJECT_ID=raji-7ce4c
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key with newlines\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email@raji-7ce4c.iam.gserviceaccount.com
```

Then update firebaseAdmin.js to use these environment variables.

## 5. Enable Google Authentication in Firebase

1. In the Firebase Console, go to "Authentication" from the left sidebar
2. Click on the "Sign-in method" tab
3. Click on "Google" in the list of providers
4. Toggle the "Enable" switch to enable Google authentication
5. Add your authorized domain (e.g., localhost for development)
6. Click "Save"

## 6. Restart Your Server

After making these changes, restart your server to apply them.

## Common Issues and Solutions

### "Unable to detect a Project Id in the current environment"
- Make sure your service account key file contains the correct project_id
- Verify that the file is in the correct location
- Check that the file has the correct format and permissions

### "Error: Service account object must contain a string "project_id" property"
- Your service account key file is missing the project_id field
- Make sure you're using the correct service account key file

### "Error: Service account object must contain a string "private_key" property"
- Your service account key file is missing the private_key field
- Make sure you're using the correct service account key file

### "Error: Service account object must contain a string "client_email" property"
- Your service account key file is missing the client_email field
- Make sure you're using the correct service account key file 