# Firebase Service Account Setup

This document provides instructions on how to set up a Firebase service account key for server-side authentication.

## Steps to Generate a Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (raji-7ce4c).
3. Click on the gear icon (⚙️) next to "Project Overview" and select "Project settings".
4. Go to the "Service accounts" tab.
5. Click on "Generate new private key" button.
6. Save the JSON file securely.

## Setting Up the Service Account Key

1. Rename the downloaded JSON file to `service-account-key.json`.
2. Place the file in the `server` directory of your project.
3. Make sure the file is not committed to version control (add it to .gitignore).

## Alternative: Using Environment Variables

If you prefer not to store the service account key as a file, you can set it up as an environment variable:

1. Create a `.env` file in the `server` directory.
2. Add the following environment variable:

```
GOOGLE_APPLICATION_CREDENTIALS=path/to/your-service-account-key.json
```

## Troubleshooting

If you encounter issues with the service account key:

1. Make sure the service account has the necessary permissions.
2. Verify that the project ID in the service account key matches your Firebase project ID.
3. Check that the private key is correctly formatted (it should include newline characters).

## Security Considerations

- Never commit your service account key to version control.
- Restrict the permissions of the service account to only what is necessary.
- Consider using environment variables or a secret management service in production. 