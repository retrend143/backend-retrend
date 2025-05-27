const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide an Email!"],
    unique: [true, "Email Exist"],
  },
  password: {
    type: String,
    unique: false,
  },
  name: {
    type: String,
    unique: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  picture: {
    type: String,
  },
  phonenumber: {
    type: String,
  },
});
const User = mongoose.model("User", UserSchema);

module.exports = User;
