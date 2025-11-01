const db = require("../../config/db");
const { validationResult } = require("express-validator");
const { getCurrentDateTime } = require("../../utilities/functions");

// get totals
const getTotals = async (req, res, next) => {
  let { search, all } = req.body;

  // default fallbacks
  search = search ? `%${search}%` : "%%";

  // dynamic condition
  const statusCondition = all
    ? "a.regional_status != 'Deleted'"
    : "a.regional_status = 'Active'";

  const sql = `SELECT
                COUNT(*) AS total_count
                FROM regionals AS a
                WHERE ${statusCondition}
                AND (a.regional_name LIKE ? OR a.regional_id LIKE ?)
                ORDER BY a.regional_id ASC`;

  db.query(sql, [search, search], (err, results) => {
    if (err) {
      return next(new Error(err.message));
    }

    if (!results.length) {
      return next(new Error("No Data Available"));
    }

    res.json({
      status: true,
      message: "Datas retrieved successfully",
      data: results[0].total_count,
    });
  });
};

// get datas
const getDatas = async (req, res, next) => {
  let { limit, offset, search, all } = req.body;

  // default fallbacks
  limit = parseInt(limit) || 10;
  offset = parseInt(offset) || 0;
  search = search ? `%${search}%` : "%%";

  // dynamic condition
  const statusCondition = all
    ? "a.regional_status != 'Deleted'"
    : "a.regional_status = 'Active'";

  const sql = `SELECT
                a.regional_id,
                a.regional_name,
                a.regional_status
                FROM regionals AS a
                WHERE ${statusCondition}
                AND (a.regional_name LIKE ? OR a.regional_id LIKE ?)
                ORDER BY a.regional_id ASC
                LIMIT ? OFFSET ?`;

  db.query(sql, [search, search, limit, offset], (err, results) => {
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

// add data
const addData = async (req, res, next) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const { regional_name, regional_status, working_user } = req.body;

    // Check if superadmin already exists
    const checkQuery =
      "SELECT regional_id FROM regionals WHERE regional_name = ? AND regional_status != 'Deleted'";
    db.query(checkQuery, [regional_name], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Region name already exists!"));
      }

      try {
        const now = getCurrentDateTime();
        const insertQuery = `INSERT INTO regionals (regional_name, regional_status, created_on, created_by) VALUES (?, ?, ?, ?)`;

        db.query(
          insertQuery,
          [regional_name, regional_status, now, working_user],
          (err, userResult) => {
            if (err) {
              return next(new Error("Data adding failed"));
            }

            res.json({
              status: true,
              message: "Data added successfully",
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

// edit data
const editData = async (req, res, next) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const { regional_id, regional_name, regional_status, working_user } =
      req.body;

    // Check if superadmin already exists
    const checkQuery =
      "SELECT regional_id FROM regionals WHERE regional_name = ? AND regional_id != ? AND regional_status != 'Deleted'";
    db.query(checkQuery, [regional_name, regional_id], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Region name already exists!"));
      }

      try {
        const now = getCurrentDateTime();
        const updateQuery = `UPDATE regionals SET regional_name = ?, regional_status = ?, modified_on = ?, modified_by = ? WHERE regional_id = ?`;

        db.query(
          updateQuery,
          [regional_name, regional_status, now, working_user, regional_id],
          (err, userResult) => {
            if (err) {
              return next(new Error("Data updating failed"));
            }

            res.json({
              status: true,
              message: "Data updated successfully",
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

// delete data
const deleteData = async (req, res, next) => {
  try {
    const { regional_id, working_user } = req.body;
    const regional_status = "Deleted";

    if (!regional_id) {
      return next(new Error(valErrors.array()[0].msg));
    }

    // Check if superadmin already exists
    const checkQuery =
      "SELECT regional_id FROM regionals WHERE regional_id = ? AND regional_status != 'Deleted'";
    db.query(checkQuery, [regional_id], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Region usage found cannot be deleted!"));
      }

      try {
        const now = getCurrentDateTime();
        const updateQuery = `UPDATE regionals SET regional_status = ?, modified_on = ?, modified_by = ? WHERE regional_id = ?`;

        db.query(
          updateQuery,
          [regional_status, now, working_user, regional_id],
          (err, userResult) => {
            if (err) {
              return next(new Error("Data deleting failed"));
            }

            res.json({
              status: true,
              message: "Data deleted successfully",
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

module.exports = {
  getTotals,
  getDatas,
  addData,
  editData,
  deleteData,
};
