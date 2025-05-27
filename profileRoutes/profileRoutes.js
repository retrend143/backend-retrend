const express = require("express");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const app = express();
const VerificationToken = require('../models/VerificationToken');
const User = require('../models/User');


const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  // Configure the transporter based on your email service provider
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Store verification tokens and email addresses in memory (replace with database storage in production)
const generateVerificationToken = () => {
    return Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
  };
  
  // Send verification OTP
  app.post("/send-verification-email", async (req, res) => {
    const { email } = req.body;
    try {
      // Check if an entry already exists for the email
      const existingToken = await VerificationToken.findOne({ email });
  
      // Generate a verification OTP
      const verificationOTP = generateVerificationToken();
      if (existingToken) {
        // If an entry exists, update only the token
        existingToken.token = verificationOTP;
        await existingToken.save();
        // console.log("Updated email-token mapping:", existingToken);
      } else {
        // If no entry exists, create a new entry
        const newToken = new VerificationToken({ email, token: verificationOTP });
        await newToken.save();
        // console.log("Saved email-token mapping:", newToken);
      }
      // Compose the email content
      const mailOptions = {
        from: "naveed.qadir012@gmail.com",
        to: email,
        subject: "OTP Verification",
        text: `Your verification OTP is: ${verificationOTP}`,
      };
      // Send the verification email
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: "Verification OTP sent" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/verify-email", auth, async (req, res) => {
    const { pin } = req.body;
    const { email } = req.body;
  
    try {
      // Find the verification token associated with the pin in the database
      const verificationToken = await VerificationToken.findOne({
        token: pin,
        email: email,
      });
  
      if (!verificationToken) {
        return res.status(400).json({ error: "Invalid verification token" });
      }
  
      // Update the email in the User model for the current user
      const updatedUser = await User.findOneAndUpdate(
        { email: req.user.userEmail },
        { email: email, isEmailVerified: true },
        { new: true }
      );
      // console.log(updatedUser);
  
      const updatedToken = jwt.sign(
        {
          userId: updatedUser._id,
          userEmail: updatedUser.email,
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );
      req.user.token = updatedToken;
  
      return res.json({
        message: "Email verification successful",
        email: updatedUser.email,
        token: updatedToken,
        name: updatedUser.name,
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/verification-status", async (req, res) => {
    try {
      const { email } = req.query;
      const isVerified = await checkVerificationStatus(email);
  
      res.json({ isVerified });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ error: "Error verifying email" });
    }
  });
  
  async function checkVerificationStatus(email) {
    try {
      const user = await User.findOne({ email });
      return user.isEmailVerified;
    } catch (error) {
      console.error("Error checking verification status:", error);
      throw error;
    }
  }
  
  app.post("/profile_edit", auth, async (req, res) => {
    try {
      // Retrieve the values from the request body
      const { name, imageUrl, phoneNumber } = req.body;
  
      // Console log the values
      console.log("Name:", name);
      console.log("Image URL:", imageUrl);
      console.log("Phone Number:", phoneNumber);
  
      // Find the user by their ID (assuming you have the user ID available in the `req.user` object)
      const updatedUser = await User.findByIdAndUpdate(req.user.userId, {
        name: name,
        picture: imageUrl,
        phonenumber: phoneNumber,
      });
  
      console.log("User updated:", updatedUser);
      res.status(200).json({
        name,
        picture: imageUrl,
        phone: phoneNumber,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.sendStatus(500); // Internal Server Error
    }
  });

  app.get("/profilesearch", async (req, res) => {
    const { useremail } = req.query;
  
    try {
      const user = await User.findOne({ email: useremail });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        name: user.name,
        picture: user.picture,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

module.exports = app