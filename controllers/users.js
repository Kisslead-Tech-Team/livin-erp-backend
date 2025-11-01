const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const {
  getCurrentDateTime,
  verifyJWT,
  encryptField,
  decryptField,
} = require("../utilities/functions");

// get user details
const getUserData = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.json({ status: false, message: "No token provided" });
  }

  const token = authHeader.replace("Bearer ", "");
  const result = verifyJWT(token);

  if (result && result.valid) {
    res.json({
      status: true,
      message: "Access granted",
      data: result.data,
      new_token: result.new_token,
    });
  } else {
    res.json({ status: false, message: result.message });
  }
};

// Login check and get user details
const login = async (req, res, next) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const { email, password } = req.body;

    // Wrapping db.query in a Promise for async/await
    const user = await new Promise((resolve, reject) => {
      const sql = `SELECT
                    a.user_id,
                    a.user_name,
                    a.user_email,
                    a.user_password,
                    b.role_name as role,
                    a.user_report_to,
                    a.user_department,
                    a.user_region,
                    a.user_showroom,
                    a.user_hub
                    FROM users AS a
                    LEFT JOIN roles AS b ON b.role_id = a.user_role
                    WHERE user_email = ?
                    AND user_status = 'Active'
                    LIMIT 1`;

      // encrypt email for deterministic lookup
      const encryptedLookupEmail = encryptField(email);

      db.query(sql, [encryptedLookupEmail], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) {
          return reject(new Error("Invalid Credentials"));
        }
        const row = results[0];
        // decrypt stored name/email before returning
        try {
          row.user_name = decryptField(row.user_name);
          row.user_email = decryptField(row.user_email);
        } catch (e) {
          // if decryption fails, leave values as-is
        }
        resolve(row);
      });
    });

    const isMatch = await bcrypt.compare(password, user.user_password);
    if (!isMatch) {
      return next(new Error("Invalid Credentials"));
    }
    const data = {
      user_id: user.user_id,
      user_name: user.user_name,
      user_email: user.user_email,
      user_role: user.role,
      user_report_to: user.user_report_to,
      user_dapartment: user.user_dapartment,
      user_region: user.user_region,
      user_showroom: user.user_showroom,
      user_hub: user.user_hub,
    };
    const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "5m" });

    res.json({
      status: true,
      message: "Login successful",
      data,
      token,
    });
  } catch (err) {
    return next(err);
  }
};

// register new superadmin
const registerSuperAdmin = async (req, res, next) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const { name, email, password } = req.body;

    // Check if superadmin already exists
    const checkQuery = "SELECT user_id FROM users WHERE user_role = ?";
    db.query(checkQuery, [1], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Superadmin already exists!"));
      }

      try {
        const now = getCurrentDateTime();
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = `INSERT INTO users (user_name, user_email, user_password, user_role, user_report_to, created_on, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        // Encrypt name and email before storing
        const encryptedName = encryptField(name);
        const encryptedEmail = encryptField(email);

        db.query(
          insertQuery,
          [encryptedName, encryptedEmail, hashedPassword, 1, 1, now, 1],
          (err, userResult) => {
            if (err) {
              return next(new Error("Registration failed"));
            }
            res.json({
              status: true,
              message: "Registered successfully",
            });
          }
        );
      } catch (err) {
        return next(err);
      }
    });
  } catch (err) {
    return next(err);
  }
};

// add new user
const addUser = (req, res, next) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const {
      user_name,
      user_email,
      user_password,
      user_branch,
      user_team,
      user_role,
      report_to,
      user_status,
      working_user,
    } = req.body;

    // Pre-compute encrypted variants for lookups and inserts
    const encryptedUserName = encryptField(user_name);
    const encryptedUserEmail = encryptField(user_email);

    // Check if email already exists
    const checkQuery = "SELECT unique_id FROM credentials WHERE email = ?";
    db.query(checkQuery, [encryptedUserEmail], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Email already exists"));
      }
      try {
        const now = getCurrentDateTime();
        const hashedPassword = await bcrypt.hash(user_password, 10);
        const insertQuery = `INSERT INTO users (user_name, user_email, user_branch, user_team, user_role, report_to, user_status, created_on, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(
          insertQuery,
          [
            encryptedUserName,
            encryptedUserEmail,
            user_branch,
            user_team,
            user_role,
            report_to,
            user_status,
            now,
            working_user,
          ],
          (err, userResult) => {
            if (err) {
              return next(new Error("Registration failed"));
            }

            const user_id = userResult.insertId;

            // Step 2: Insert into credentials table
            const insertCredQuery = `
              INSERT INTO credentials (name, email, password, role, user_id, status, created_on, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
              insertCredQuery,
              [
                encryptedUserName,
                encryptedUserEmail,
                hashedPassword,
                user_role,
                user_id,
                user_status,
                now,
                working_user,
              ],
              (err, credResult) => {
                if (err) {
                  return next(new Error("Credential creation failed"));
                }
                res.json({
                  status: true,
                  message: "User registered successfully",
                });
              }
            );
          }
        );
      } catch (err) {
        return next(err);
      }
    });
  } catch (err) {
    return next(err);
  }
};

// edit new user
const editUser = (req, res, next) => {
  try {
    console.log("valErrors");
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const {
      user_id,
      user_name,
      user_email,
      user_branch,
      user_team,
      user_role,
      report_to,
      user_status,
      working_user,
    } = req.body;

    // Check if email already exists
    const checkQuery =
      "SELECT unique_id FROM credentials WHERE email = ? AND user_id != ?";
    db.query(checkQuery, [user_email, user_id], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Email already exists"));
      }
      try {
        const now = getCurrentDateTime();
        const updateQuery = `UPDATE users SET 
                              user_name = ?, 
                              user_email = ?, 
                              user_branch = ?, 
                              user_team = ?, 
                              user_role = ?, 
                              report_to = ?, 
                              user_status = ?, 
                              modified_on = ?, 
                              modified_by = ?
                            WHERE user_id = ?`;

        // encrypt fields for update
        const encryptedUpdateName = encryptField(user_name);
        const encryptedUpdateEmail = encryptField(user_email);

        db.query(
          updateQuery,
          [
            encryptedUpdateName,
            encryptedUpdateEmail,
            user_branch,
            user_team,
            user_role,
            report_to,
            user_status,
            now,
            working_user,
            user_id,
          ],
          (err, userResult) => {
            if (err) {
              return next(new Error("Updation failed"));
            }

            // Step 2: Update into credentials table
            const updateCredQuery = `UPDATE credentials SET name = ?, email = ?, role = ?, status = ?, modified_on = ?, modified_by = ? WHERE user_id = ?`;

            db.query(
              updateCredQuery,
              [
                encryptedUpdateName,
                encryptedUpdateEmail,
                user_role,
                user_status,
                now,
                working_user,
                user_id,
              ],
              (err, credResult) => {
                if (err) {
                  return next(new Error("Credential Update failed"));
                }
                res.json({
                  status: true,
                  message: "User Updated successfully",
                });
              }
            );
          }
        );
      } catch (err) {
        return next(err);
      }
    });
  } catch (err) {
    return next(err);
  }
};

// get all users data
const getAllUsers = async (req, res, next) => {
  const sql = `SELECT 
                  a.user_id,
                  a.user_name,
                  a.user_email,
                  a.user_branch,
                  a.user_team,
                  a.user_role,
                  a.user_status,
                  a.report_to,
                  b.user_name AS report_to_name,
                  b.user_role AS report_to_role
                FROM users AS a
                LEFT JOIN users AS b ON b.user_id = a.report_to
                WHERE a.user_status >= 1
                ORDER BY a.user_id DESC`;

  db.query(sql, (err, results) => {
    if (err) {
      return next(new Error(err.message));
    }

    if (!results.length) {
      return next(new Error("No Data Available"));
    }

    // Decrypt name/email fields before sending
    const decryptedResults = results.map((r) => {
      try {
        return {
          ...r,
          user_name: decryptField(r.user_name),
          user_email: decryptField(r.user_email),
        };
      } catch (e) {
        return r;
      }
    });

    res.json({
      status: true,
      message: "Datas retrieved successfully",
      data: decryptedResults,
    });
  });
};

// get report to persons
const getReportToPersons = async (req, res, next) => {
  const { user_branch, user_team, user_role } = req.body;

  if (!user_role) {
    return next(new Error("Missing required fields"));
  }

  const filters = [];
  const values = [];

  // Dynamically add filters based on non-null input
  if (user_branch) {
    filters.push("a.user_branch = ?");
    values.push(user_branch);
  }

  if (user_team) {
    filters.push("a.user_team = ?");
    values.push(user_team);
  }

  if (user_role) {
    filters.push("a.user_role = ?");
    values.push(user_role);
  }

  // Always filter active users
  filters.push("(a.user_status = 1 OR a.user_status IS NULL)");

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sql = `
      SELECT 
        a.user_id,
        CONCAT(a.user_name, ' (', a.user_role, ')') AS user_name
      FROM users AS a 
      ${whereClause}
      ORDER BY a.user_id
    `;

  db.query(sql, values, (err, results) => {
    if (err) {
      return next(new Error(err.message));
    }

    if (!results.length) {
      return next(new Error("No Data Available"));
    }

    res.json({
      status: true,
      message: "Datas retrieved successfully",
      data: results,
    });
  });
};

module.exports = {
  getUserData,
  login,
  registerSuperAdmin,
  addUser,
  editUser,
  getAllUsers,
  getReportToPersons,
};
