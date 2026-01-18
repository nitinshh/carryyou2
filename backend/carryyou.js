require("dotenv").config();

const express = require("express");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const fileUpload = require("express-fileupload");
const swaggerUi = require("swagger-ui-express");
const cors = require('cors')

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/userRoute")();
const driverRouter = require("./routes/driverRoute")();
const { connectdb } = require("./dbConnection");

const app = express();
const PORT = process.env.PORT || 4005;

connectdb();

var server = require('http').createServer(app);
const io = require("socket.io")(server);

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


require('./socket/socket')(io);

// Global Middlewares
app.use(cors())
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// File Upload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Swagger Docs
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      { url: "/user", name: "User API" },
      { url: "/driver", name: "Driver API" },
    ],
  }, 
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, swaggerOptions));

// Routes
app.use("/", indexRouter);
// app.use("/users", usersRouter);
// app.use("/driver", driverRouter);

// 404 Handler
app.use((req, res, next) => next(createError(404)));

// Error Handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});
// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
