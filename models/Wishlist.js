const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
  useremail: {
    type: String,
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Compound index to prevent duplicate wishlist entries
WishlistSchema.index({ useremail: 1, productId: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", WishlistSchema);

module.exports = Wishlist; 