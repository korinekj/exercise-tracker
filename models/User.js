const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  username: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);
