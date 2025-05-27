const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../firebaseAdmin');

const app = express();

app.post("/google-auth", async (req, res) => {
  try {
    const idToken = req.body.credential;
    
    if (!idToken) {
      console.error("No ID token provided");
      return res.status(400).json({ message: "No ID token provided" });
    }
    
    console.log("Received token:", idToken.substring(0, 20) + "...");
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Token verified successfully");
    
    // Get user information from the decoded token
    const { email, name, email_verified, picture } = decodedToken;
    console.log("User info from token:", { email, name });
    
    // Check if the user already exists in your database
    const user = await User.findOne({ email });
    
    if (user) {
      console.log("Existing user found:", user.email);
      // If the user exists, generate a JWT token and return it to the client
      const token = jwt.sign(
        {
          userId: user._id,
          userEmail: user.email,
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );

      return res.status(200).json({
        token,
        email: user.email,
        name: user.name,
        picture: user.picture || picture,
        phone: user.phonenumber || "",
      });
    } else {
      console.log("Creating new user for:", email);
      // If the user doesn't exist, create a new user
      const newUser = new User({
        email: email,
        name: name || email.split('@')[0],
        isEmailVerified: email_verified || true,
        picture: picture || "",
      });

      const result = await newUser.save();
      console.log("New user created:", result.email);
      
      const token = jwt.sign(
        {
          userId: result._id,
          userEmail: result.email,
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );
      
      return res.status(201).json({
        token,
        email: result.email,
        name: result.name,
        picture: result.picture || picture || "",
        phone: result.phonenumber || "",
      });
    }
  } catch (error) {
    console.error("Error in Google authentication:", error);
    return res.status(400).json({ 
      message: "Invalid Firebase ID token or authentication error", 
      error: error.message 
    });
  }
});

module.exports = app;
  