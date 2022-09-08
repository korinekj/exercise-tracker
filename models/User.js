const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  username: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
