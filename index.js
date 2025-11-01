require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const errorHandler = require("./middlewares/error");
const { getCurrentDateTime } = require("./utilities/functions");
const app = express();
const PORT = process.env.PORT || 1111;

// Allow CORS from localhost:3000
const allowedOrigins = [
  "http://localhost:5173",
  "https://erp-frontend-indol.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());

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

// masters routes
const mastersRoutes = require("./routes/masters");
app.use("/masters", mastersRoutes);

app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
