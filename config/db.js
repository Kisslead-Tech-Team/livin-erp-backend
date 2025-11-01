const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  timezone: "+05:30", // for Asia/Kolkata
});

db.connect((err) => {
  if (err) {
    console.error("DB connection failed: ", err.stack);
    return;
  }
  console.log("Connected to MySQL DB");
});

module.exports = db;
