# Firebase Admin SDK Setup

This document provides instructions on how to set up the Firebase Admin SDK for server-side authentication.

## Prerequisites

1. A Firebase project (the same one used for client-side authentication)
2. Node.js and npm installed

## Steps to Set Up Firebase Admin SDK

### 1. Generate a Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Click on the gear icon (⚙️) next to "Project Overview" and select "Project settings".
4. Go to the "Service accounts" tab.
5. Click on "Generate new private key" button.
6. Save the JSON file securely. This file contains sensitive information.

### 2. Set Up Environment Variables

For security reasons, it's recommended to use environment variables instead of directly including the service account key in your code.

1. Create a `.env` file in the root of your server directory (if it doesn't exist already).
2. Add the following environment variables:

```
GOOGLE_APPLICATION_CREDENTIALS=path/to/your-service-account-key.json
```

Alternatively, you can set up the environment variable in your system:

- **Windows (PowerShell):**
  ```
  $env:GOOGLE_APPLICATION_CREDENTIALS="path\to\your-service-account-key.json"
  ```

- **Linux/macOS:**
  ```
  export GOOGLE_APPLICATION_CREDENTIALS="path/to/your-service-account-key.json"
  ```

### 3. Initialize Firebase Admin SDK

The Firebase Admin SDK is already set up in the `firebaseAdmin.js` file. If you want to use a service account key file directly in the code (not recommended for production), you can modify the initialization as follows:

```javascript
admin.initializeApp({
  credential: admin.credential.cert(require('./path-to-service-account-key.json')),
});
```

### 4. Verify Firebase ID Tokens

The server is now set up to verify Firebase ID tokens sent from the client. When a user signs in with Google on the client side, the client will send the ID token to the server, which will verify it using the Firebase Admin SDK.

## Troubleshooting

- If you encounter an error like "Error: Failed to determine project ID", make sure your service account key file is correctly set up and the environment variable is pointing to the right file.
- If token verification fails, check that the token is being correctly passed from the client to the server.
- Ensure that the Firebase project used for the Admin SDK is the same as the one used for client-side authentication.

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Verify ID Tokens Documentation](https://firebase.google.com/docs/auth/admin/verify-id-tokens) 