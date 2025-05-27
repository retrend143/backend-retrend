const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, expires: "15m", default: Date.now },
});

const VerificationToken = mongoose.model(
  "VerificationToken",
  verificationTokenSchema
);

module.exports = VerificationToken;
