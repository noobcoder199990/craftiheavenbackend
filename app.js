require("dotenv").config();
const express = require("express");
const app = express();
var http = require("http");

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
var { error } = require("./response.js");
const cors = require("cors");
const log = require("./logger/index.js");
const userModel = require("./models/UserModel.js");

var server = http.createServer(app);

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  log.debug("Listening on " + bind);
}

const imageRouter = require("./Router/ImageUpload.js");
const photoUpload = require("./Router/photoUpload.js");
const userRouter = require("./Router/userRouter.js");
const categoryRouter = require("./Router/categoryRouter.js");
const subcategoryRouter = require("./Router/subCategoryRouter.js");
const productRouter = require("./Router/productRouter.js");
const ratingRouter = require("./Router/ratingRouter.js");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("website"));
console.log(JSON.parse(process.env.ALLOWED_ORIGINS));

app.use(
  cors({ origin: JSON.parse(process.env.ALLOWED_ORIGINS), credentials: true })
);
app.use((req, res, next) => {
  log.debug(req.cookies["jwt"]);
  if (
    (req.cookies && req.cookies["jwt"]) ||
    (req.headers.authorization != undefined &&
      req.headers.authorization.includes("Bearer "))
  ) {
    let token = req.cookies["jwt"];
    if (req.headers.authorization) {
      token = req.headers.authorization.split("Bearer ")[1];
    }
    log.debug(token, process.env.JWT_SECRET);
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        res.clearCookie("jwt");
        log.debug(err);
        return error(res, 401, "Unauthorized");
      }
      try {
        let doc = await userModel.findById(decoded.payload).exec();
        if (doc) {
          req.user = doc;
          return next();
        }
        res.clearCookie("jwt");
        // req.headers.authorization = '';
        req.headers.authorization = "";
        req.headers.authorization = "";

        next();
      } catch (err) {
        error(res, 500, "Internal server error");
      }
    });
  } else {
    next();
  }
});
app.use("/", imageRouter);
app.use("/api/v1/image", imageRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/subcategory", subcategoryRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/photo", photoUpload);
app.use("/api/v1/rating", ratingRouter);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on("reconnect", () => {
  log.debug("reconnected with db!");
});

mongoose.connection.on("disconnected", () => {
  log.debug(`DB disconnected ${new Date()}`);
});

module.exports = app;
