const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const User = require("../models/User");
const Exercise = require("../models/Excercise");

// All Users Route

// VYTVOŘ NOVÉHO UŽIVATELE (ulož do databáze)
router.post("/", function (req, res) {
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
router.get("/", async function (req, res) {
  //ZKRÁCENÝ POMOCÍ ASYNC/AWAIT
  const allUsers = await User.find({});

  res.send(allUsers);

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
});

// VYTVOŘ NOVÝ CVIK
router.post("/:_id/exercises", async function (req, res) {
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

        res.send(final);
      })
      .catch((error) => {
        console.log(error);
      });
  } else res.send("INVALID ID");
});

// NAČTI LOG CVIKŮ UŽIVATELE
router.get("/:_id/logs", async function (req, res) {
  console.log(`req.body: ${JSON.stringify(req.body)}`);
  console.log(`req.params: ${JSON.stringify(req.params)}`);
  console.log(`req.query: ${JSON.stringify(req.query)}`);

  const validObjectId = mongoose.Types.ObjectId.isValid(req.params._id);

  if (validObjectId) {
    const isExistingUser = await User.exists({ _id: req.params._id });

    if (isExistingUser === null) {
      res.send("TOTO ID UŽIVATELE NEEXISTUJE");
      return;
    }

    let queryString;

    if (Object.keys(req.query).length === 0) {
    } else {
      queryString = req.query;
    }

    const user = await User.findById(req.params._id);

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

    let allUserExercises;

    if (req.query.limit === undefined) {
      allUserExercises = await Exercise.find(query);
    } else {
      allUserExercises = await Exercise.find(query).limit(
        parseInt(req.query.limit)
      );
    }

    const userExerciseCount = allUserExercises.length;

    const logExercises = allUserExercises.map((exercise) => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      };
    });
    // zkrácený zápis kódu hore -> pokročilý kód...zřejmě použití Destructuring object??
    // let logExercises = allUserExercises.map(
    //   ({ description, duration, date }) => {
    //     return { description, duration, date };
    //   }
    // );

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

    res.json(response);
  } else {
    res.send("INVALID ID");
  }
});

module.exports = router;
