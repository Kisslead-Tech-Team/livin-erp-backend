const express = require("express");
const app = express();
const { getCurrentDateTime } = require("./utilities/functions");

// check api
app.get("/", (req, res) => {
  res.send("Backend server is running at " + getCurrentDateTime());
});

// login routes
const userRoutes = require("./routes/users");
app.use("/user", userRoutes);

// regional routes
const regionalsRoutes = require("./routes/masters/regionals");
app.use("/regionals", regionalsRoutes);

// role routes
const rolesRoutes = require("./routes/masters/roles");
app.use("/roles", rolesRoutes);

module.exports = app;
