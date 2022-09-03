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
  _id: mongoose.Types.ObjectId,
  username: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const Exercise = mongoose.model("Exercise", ExerciseSchema);

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
    _id: new mongoose.Types.ObjectId(),
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
app.get("/api/users", async function (req, res) {
  //---------POMOCÍ PROMISE-----------//
  // const allUsers = new Promise((resolve, reject) => {
  //   resolve(User.find({}));
  // });
  // allUsers
  //   .then((result) => {
  //     res.send(result);
  //   })
  //   .catch((error) => {
  //     console.log(error);
  //   });

  //ZKRÁCENÝ POMOCÍ ASYNC FUNCTION/AWAIT
  const allUsers = await User.find({});

  res.send(allUsers);
});

//---------------POST AND GET /api/users/:_id/exercises ------------------//

// VYTVOŘ NOVÝ CVIK
app.post("/api/users/:_id/exercises", async function (req, res) {
  //check if Object id is in database
  var validObjectId = mongoose.Types.ObjectId.isValid(req.params._id);
  console.log(validObjectId);

  if (validObjectId) {
    //ověření datumu
    if (req.body.date === "") {
      req.body.date = new Date().toDateString();
    } else {
      req.body.date = new Date(req.body.date).toDateString();
    }

    const isExistingUser = await User.exists({ _id: req.params._id });
    console.log("user exists: ", isExistingUser);

    const userId = new Promise((resolve, reject) => {
      resolve(User.findById(req.params._id));
    });

    userId
      .then((result) => {
        const exercise = new Exercise({
          username: result.username,
          description: req.body.description,
          duration: req.body.duration,
          date: req.body.date,
        });

        exercise.save((error, exercise) => {
          if (error) {
            console.log(error);
          } else {
            console.log(exercise + "EXERCISE SAVED TO DATABASE");
          }
        });

        let userObj = Object.assign({}, result.toObject());
        delete userObj.__v;

        let exerciseObj = {
          date: exercise.date,
          duration: exercise.duration,
          description: exercise.description,
        };

        let final = Object.assign(userObj, exerciseObj);

        res.send(final);

        //také správná odpověď
        // res.json({
        //   _id: result.id,
        //   username: result.username,
        //   date: exercise.date,
        //   duration: exercise.duration,
        //   description: exercise.description,
        // });
      })
      .catch((error) => {
        console.log(error);
      });
  } else res.send("TOTO ID UŽIVATELE NEEXISTUJE");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
