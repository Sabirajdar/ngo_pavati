let express = require("express");
let app = express();
let cookieParser = require("cookie-parser");
let cors = require("cors");
let dotenv = require("dotenv");
let path = require("path");

let router = require("./routes/routes.js");   // ✅ correct

dotenv.config();

/* MIDDLEWARE */

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());

/* STATIC FILES */

app.use(express.static(path.join(__dirname, "../public")));

/* SERVE UPLOADED FILES */

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* VIEW ENGINE */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

/* ROUTES */
app.use((req, res, next) => {

  res.locals.memberName = "Guest";  // default
  res.locals.data = {};             // prevents EJS error

  if (req.user && req.user.username) {
    res.locals.memberName = req.user.username;
  }

  next();
});

app.use("/", router);

module.exports = app;