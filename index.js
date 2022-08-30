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

const UserSchema = new mongoose.Schema({
  username: String,
});

const User = mongoose.model("User", UserSchema);

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

  const user = new User({
    username: req.body.username,
  });
  console.log("User: ", user);

  user.save((error, data) => {
    if (error) {
      console.log(error);
    } else {
      console.log(data, "DATA (new user) saved to database");
    }
  });

  res.json({
    username: user.username,
    _id: user.id,
  });
});

app.get("/api/users", function (req, res) {
  const allUsers = new Promise((resolve, reject) => {
    resolve(User.find({}));
  });

  allUsers
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
