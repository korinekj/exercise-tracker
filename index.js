require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

/**------------- <DATABASE> ----------------*/

//connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// check for proper connection
const database = mongoose.connection;
database.on("error", console.error.bind(console, "connection error: "));
database.once("open", () => {
  console.log("mongo database connected");
});

const newUserSchema = new mongoose.Schema({
  username: String,
});

const NewUser = mongoose.model("NewUser", newUserSchema);

/**------------- </DATABASE> ----------------*/

/**------------- <EXPRESS APP> ----------------*/

app.use(cors());
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", function (req, res) {
  console.log("req.body: ", req.body);

  const newUser = new NewUser({
    username: req.body.username,
  });
  console.log("newUser: ", newUser);

  newUser.save((error, data) => {
    if (error) {
      console.log(error);
    } else {
      console.log(data, "DATA (new user) saved to database");
    }
  });

  res.json({
    username: newUser.username,
    _id: newUser.id,
  });
});

app.get("/api/users", function (req, res) {
  let allUsers;
  NewUser.find({}, function (err, docs) {
    if (err) throw err;

    allUsers = docs;
  });
  console.log(allUsers);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
