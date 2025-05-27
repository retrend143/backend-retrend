const express = require('express');
const auth = require("../middleware/auth");
const Message = require('../models/Message');
const User = require('../models/User');
const Product = require('../models/Product');
const app = express();

app.post("/sendMessage", auth, async (req, res) => {
  const id = req.body.id;
  const messageContent = req.body.message;
  const mailto = req.body.to;

  try {
    const product = await Product.findOne({ _id: id });
    const userto = await User.findOne({ email: mailto });

    if (!product || !userto) {
      return res.status(400).json({
        success: false,
        message: "Invalid product or recipient email",
      });
    }

    if (product.useremail === req.user.userEmail) {
      const message = await Message.findOne({ product_id: id, from: mailto });

      if (!message) {
        return res.status(201).json({
          success: false,
          message: "You can't send a message to this user for this product",
        });
      }
    }

    if (product.useremail !== mailto && product.useremail !== req.user.userEmail) {
      return res.status(201).json({
        success: false,
        message: "You can't send a message to this user for this product",
      });
    }

    const newMessage = new Message({
      from: req.user.userEmail,
      to: mailto,
      message: messageContent,
      product_id: id,
    });

    // Save the message document
    await newMessage.save();
    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ success: false, message: "Error sending message" });
  }
});


  
  app.get("/api/new-messages", auth, async (req, res) => {
    const id = req.query.id; // Use req.query to access query parameters
    const to = req.query.to; 
    const mailfrom = req.user.userEmail;
      try {
      const newMessages = await Message.find({
        $or: [
          { from: mailfrom, to:to, product_id: id },
          { to: mailfrom, from:to, product_id: id },
        ],
      });
      // console.log(newMessages)
      res.json(newMessages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  app.get("/api/newchats", auth, async (req, res) => {
    try {
      const mailfrom = req.user.userEmail;
  
      const newChats = await Message.aggregate([
        {
          $match: {
            $or: [{ from: mailfrom }, { to: mailfrom }],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: "$product_id",
            latestMessage: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: { newRoot: "$latestMessage" },
        },
      ]);
  
      const uniqueEmails = [...new Set(newChats.map(chat => chat.from === mailfrom ? chat.to : chat.from))];
      
      // Make sure we're finding users case-insensitively
      const users = await User.find({ 
        email: { 
          $in: uniqueEmails.map(email => new RegExp('^' + email + '$', 'i')) 
        } 
      });
  
      // Create a map of emails to user data
      const emailToUserMap = {};
      users.forEach(user => {
        // Ensure the picture URL is valid
        const picture = user.picture && user.picture !== "undefined" 
          ? user.picture 
          : "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp";
        
        emailToUserMap[user.email.toLowerCase()] = { 
          name: user.name, 
          picture: picture 
        };
      });
  
      // Attach user data to each chat
      newChats.forEach(chat => {
        const otherUserEmail = chat.from === mailfrom ? chat.to : chat.from;
        chat.user = emailToUserMap[otherUserEmail.toLowerCase()] || { 
          name: "User", 
          picture: "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp" 
        };
      });
  
      newChats.sort((a, b) => b.createdAt - a.createdAt);
  
      res.json(newChats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  app.post("/deletechat/:id", auth, async (req, res) => {
    const id = req.params.id;
    const mailfrom = req.user.userEmail;
  
    try {
      const result = await Message.deleteMany({
        $or: [
          { from: mailfrom, product_id: id },
          { to: mailfrom, product_id: id },
        ],
      });
  
      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Chat deleted" });
      } else {
        res.status(404).json({ message: "Chat not found" });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  });

// Add this route to your existing chatRoutes.js file

app.post("/mark-messages-read", auth, async (req, res) => {
  const { messageIds } = req.body;
  
  try {
    // Update all messages in the array to mark them as read
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { isRead: true } }
    );
    
    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ success: false, message: "Error updating messages" });
  }
});

// Add unreadMessages route at the top level
app.get("/unreadMessages", auth, async (req, res) => {
  console.log("unreadMessages endpoint called by:", req.user.userEmail);
  try {
    const userEmail = req.user.userEmail;
    
    // Count messages where the user is the recipient and messages are not read
    const unreadCount = await Message.countDocuments({
      to: userEmail,
      isRead: { $ne: true }
    });
    
    console.log("Unread messages count for", userEmail, ":", unreadCount);
    
    res.status(200).json({ 
      success: true, 
      count: unreadCount 
    });
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching unread messages",
      error: error.message
    });
  }
});

module.exports = app;
