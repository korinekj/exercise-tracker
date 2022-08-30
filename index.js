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

//---------------POST AND GET /api/users ------------------//

// VYTVOŘ NOVÉHO UŽIVATELE (ulož do databáze)
app.post("/api/users", function (req, res) {
  const user = new User({
    username: req.body.username,
  });

  user.save((error, data) => {
    if (error) {
      console.log(error);
    } else {
      console.log(data, "DATA (new user) saved to database");
    }
  });

  console.log(user);

  res.json({
    username: user.username,
    _id: user.id,
  });
});

// NAČTI VŠECHNY UŽIVATELE Z DATABÁZE
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

//---------------POST AND GET /api/users/:_id/exercises ------------------//

// VYTVOŘ NOVÝ CVIK
app.post("/api/users/:_id/exercises", function (req, res) {
  console.log(req.body);
  console.log(req.params);

  //check if Object id is in database
  var valid = mongoose.Types.ObjectId.isValid(req.params._id);
  console.log(valid);

  if (valid) {
    const userId = new Promise((resolve, reject) => {
      resolve(User.findById(req.params["_id"]));
    });

    userId
      .then((result) => {
        console.log(result);
        res.json({
          _id: result.id,
          username: result.username,
          date: new Date(),
          duration: req.body.duration,
          description: req.body.description,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  } else res.send("TOTO ID UŽIVATELE NEEXISTUJE");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
