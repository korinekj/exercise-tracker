require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const indexRouter = require("./controllers/index");
const userRouter = require("./controllers/users");

/**------------- <DATABASE> ----------------*/
const mongoose = require("mongoose");

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

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/", indexRouter);
app.use("/api/users", userRouter);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
