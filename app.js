const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require('cors');

const invoiceRouter = require("./routes/index");
const app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  // Set the Access-Control-Allow-Origin header
  res.header("Access-Control-Allow-Origin", "*"); // Or '*' for any origin during development

  // Other CORS headers you might need
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Content-Disposition", "")

  next();
});

app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Disposition']
}))

app.use("/api/v1", invoiceRouter);

module.exports = app;
