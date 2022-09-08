require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

const indexRouter = require("./controllers/index");

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

/**------------- </DATABASE> ----------------*/

/**------------- <EXPRESS APP> ----------------*/

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/", indexRouter);

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

// VYTVOŘ NOVÝ CVIK
app.post("/api/users/:_id/exercises", async function (req, res) {
  console.log(`req.body: ${JSON.stringify(req.body)}`);
  console.log(`req.params: ${JSON.stringify(req.params)}`);
  console.log(`req.query: ${JSON.stringify(req.query)}`);

  //check if Object id is valid mongodb ObjectId
  const validObjectId = mongoose.Types.ObjectId.isValid(req.params._id);

  const date = new Date(req.body.date);

  const validDate =
    date &&
    Object.prototype.toString.call(date) === "[object Date]" &&
    !isNaN(date);

  if (validObjectId) {
    //ověření datumu
    if (req.body.date === "") {
      req.body.date = new Date();
    } else if (req.body.date === undefined || req.body.date === null) {
      req.body.date = new Date();
    } else if (validDate) {
      req.body.date = new Date(req.body.date);
    } else {
      res.send("NEPLATNÝ FORMÁT DATUMU");
      return;
    }

    const isExistingUser = await User.exists({ _id: req.params._id });

    if (isExistingUser === null) {
      res.send("TOTO ID UŽIVATELE NEEXISTUJE");
      return;
    }

    const userId = new Promise((resolve, reject) => {
      resolve(User.findById(req.params._id));
    });

    userId
      .then((result) => {
        const exercise = new Exercise({
          userId: req.params._id,
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

        let dateString = req.body.date.toDateString();

        let exerciseObj = {
          date: dateString,
          duration: exercise.duration,
          description: exercise.description,
        };

        let final = Object.assign(userObj, exerciseObj);

        console.log("FINAL RESPONSE: ", final);
        res.send(final);

        // //také správná odpověď fcc test
        // res.json({
        //   _id: result.id,
        //   username: result.username,
        //   date: exercise.date.toDateString(),
        //   duration: exercise.duration,
        //   description: exercise.description,
        // });
      })
      .catch((error) => {
        console.log(error);
      });
  } else res.send("INVALID ID");
});

// NAČTI LOG CVIKŮ UŽIVATELE
app.get("/api/users/:_id/logs", async function (req, res) {
  console.log(`req.body: ${JSON.stringify(req.body)}`);
  console.log(`req.params: ${JSON.stringify(req.params)}`);
  console.log(`req.query: ${JSON.stringify(req.query)}`);

  const validObjectId = mongoose.Types.ObjectId.isValid(req.params._id);
  console.log("IS Valid Object ID: ", validObjectId);

  if (validObjectId) {
    const isExistingUser = await User.exists({ _id: req.params._id });
    console.log("user exists: ", isExistingUser);

    if (isExistingUser === null) {
      res.send("TOTO ID UŽIVATELE NEEXISTUJE");
      return;
    }

    let queryString;

    if (Object.keys(req.query).length === 0) {
      console.log("NO QUERY STRING");
    } else {
      queryString = req.query;
    }
    console.log("QUERY STRING: ", queryString);

    const user = await User.findById(req.params._id);
    console.log("User: ", user);

    let query;

    if (queryString === undefined) {
      query = {
        userId: user._id,
      };
    } else if (queryString.from !== undefined && queryString.to !== undefined) {
      query = {
        userId: user._id,
        date: {
          $gte: queryString.from === "" ? "50" : queryString.from,
          $lte: queryString.to === "" ? "9999" : queryString.to,
        },
      };
    } else if (queryString.from !== undefined && queryString.to === undefined) {
      query = {
        userId: user._id,
        date: { $gte: queryString.from === "" ? "50" : queryString.from },
      };
    } else if (queryString.from === undefined && queryString.to !== undefined) {
      query = {
        userId: user._id,
        date: { $lte: queryString.to === "" ? "9999" : queryString.to },
      };
    } else if (queryString.from === undefined && queryString.to === undefined) {
      query = {
        userId: user._id,
      };
    }
    console.log("QUERY: ", query);

    let allUserExercises;
    if (req.query.limit === undefined) {
      allUserExercises = await Exercise.find(query);
    } else {
      allUserExercises = await Exercise.find(query).limit(
        parseInt(req.query.limit)
      );
    }

    //console.log("exercises", allUserExercises);

    const userExerciseCount = allUserExercises.length;
    //console.log("Exercise Count: ", typeof userExerciseCount);

    //console.log("MY JSON RESPONSE:", { count: allUserExercises.length });

    const logExercises = allUserExercises.map((exercise) => {
      //console.log("TYPEOF: ", exercise);
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      };
    });

    let response;

    if (queryString === undefined) {
      response = {
        count: userExerciseCount,
        username: user.username,
        id: user._id,
        log: logExercises,
      };
    } else {
      response = {
        from: new Date(queryString.from).toDateString(),
        to: new Date(queryString.to).toDateString(),
        count: userExerciseCount,
        username: user.username,
        id: user._id,
        log: logExercises,
      };
    }

    console.log("LOG RESPONSE:", response);
    res.json(response);

    // res.json({
    //   test: req.query,
    // });
    // zkrácený zápis kódu hore -> pokročilý kód...zřejmě použití Destructuring object??
    // let logExercises = allUserExercises.map(
    //   ({ description, duration, date }) => {
    //     return { description, duration, date };
    //   }
    // );
  } else {
    res.send("INVALID ID");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
