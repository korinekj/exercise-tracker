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

/**------------- </DATABASE> ----------------*/

/**------------- <EXPRESS APP> ----------------*/

app.use(cors());
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", function (req, res) {
  const userName = req.body.username;
  console.log(req.body);
  res.json({
    username: userName,
    _id: "zde id z databáze",
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
