const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../firebaseAdmin');

const app = express();

app.post("/phone-auth", async (req, res) => {
  try {
    const idToken = req.body.credential;
    const phoneNumber = req.body.phoneNumber;
    
    if (!idToken) {
      console.error("No ID token provided");
      return res.status(400).json({ message: "No ID token provided" });
    }
    
    console.log("Received phone auth request for:", phoneNumber);
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Token verified successfully");
    
    // Check if the phone number in the token matches the one sent
    if (decodedToken.phone_number !== phoneNumber) {
      console.error("Phone number mismatch");
      return res.status(400).json({ message: "Phone number mismatch" });
    }
    
    // Check if the user already exists in your database
    let user = await User.findOne({ phonenumber: phoneNumber });
    
    if (user) {
      console.log("Existing user found with phone:", phoneNumber);
      // If the user exists, generate a JWT token and return it to the client
      const token = jwt.sign(
        {
          userId: user._id,
          userPhone: user.phonenumber,
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );

      return res.status(200).json({
        token,
        email: user.email || '',
        name: user.name || phoneNumber,
        picture: user.picture || "",
        phone: phoneNumber,
      });
    } else {
      console.log("Creating new user for phone:", phoneNumber);
      // If the user doesn't exist, create a new user
      const newUser = new User({
        phonenumber: phoneNumber,
        name: phoneNumber, // Use phone number as name initially
        isPhoneVerified: true,
      });

      const result = await newUser.save();
      console.log("New user created with phone:", result.phonenumber);
      
      const token = jwt.sign(
        {
          userId: result._id,
          userPhone: result.phonenumber,
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );
      
      return res.status(201).json({
        token,
        email: '',
        name: phoneNumber,
        picture: "",
        phone: phoneNumber,
      });
    }
  } catch (error) {
    console.error("Error in phone authentication:", error);
    return res.status(400).json({ 
      message: "Invalid Firebase ID token or authentication error", 
      error: error.message 
    });
  }
});

module.exports = app; 