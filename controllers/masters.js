const db = require("../config/db");
const { validationResult } = require("express-validator");

// get all branchs
const getAllBranch = async (req, res, next) => {
  const sql = `SELECT
                a.branch_id,
                a.branch_name,
                a.branch_status
                FROM branch AS a
                WHERE a.branch_status >= 1
                ORDER BY a.branch_name ASC`;

  db.query(sql, (err, results) => {
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

// get active branchs
const getActiveBranchs = async (req, res, next) => {
  const sql = `SELECT
                a.branch_name
                FROM branch AS a
                WHERE a.branch_status = 1
                ORDER BY a.branch_name ASC`;

  db.query(sql, (err, results) => {
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

// add branch
const addBranch = (req, res, next) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const { branch_id, branch_name, branch_status, working_user } = req.body;

    try {
      const now = getCurrentDateTime();
      const insertQuery = `INSERT INTO branch (branch_name, branch_status, created_on, created_by) VALUES (?, ?, ?, ?)`;

      db.query(
        insertQuery,
        [branch_name, branch_status, now, working_user],
        (err, userResult) => {
          if (err) {
            return next(new Error("Branch adding failed"));
          }

          res.json({
            status: true,
            message: "Branch added successfully",
          });
        }
      );
    } catch (err) {
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
};

// get active teams
const getActiveTeams = async (req, res, next) => {
  const sql = `SELECT
                a.team_name
                FROM teams AS a
                WHERE a.team_status = 1
                ORDER BY a.team_id ASC`;

  db.query(sql, (err, results) => {
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

// get active roles
const getActiveRoles = async (req, res, next) => {
  const sql = `SELECT
                a.role_name
                FROM roles AS a
                WHERE a.role_status = 1
                ORDER BY a.role_id ASC`;

  db.query(sql, (err, results) => {
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
  getAllBranch,
  getActiveBranchs,
  getActiveTeams,
  getActiveRoles,
};
