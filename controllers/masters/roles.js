const db = require("../../config/db");
const { validationResult } = require("express-validator");
const { getCurrentDateTime } = require("../../utilities/functions");

// get totals
const getTotals = async (req, res, next) => {
  let { search } = req.body;

  // default fallbacks
  search = search ? `%${search}%` : "%%";

  const sql = `SELECT
                COUNT(*) AS total_count
                FROM roles AS a
                LEFT JOIN roles AS b ON b.role_id = a.role_report_to
                WHERE a.role_status != 'Deleted'
                AND a.role_id > 1
                AND (a.role_name LIKE ? 
                    OR a.role_department LIKE ? 
                    OR b.role_name LIKE ?)
                ORDER BY a.role_id ASC`;

  db.query(sql, [search, search, search], (err, results) => {
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
  let { limit, offset, search, sortField, sortOrder } = req.body;

  // default fallbacks
  limit = parseInt(limit) || 10;
  offset = parseInt(offset) || 0;
  search = search ? `%${search}%` : "%%";
  if (sortField) {
    sortOrder = sortOrder === "descend" ? "DESC" : "ASC";
    sortField = sortField === "report_to" ? "role_report_to" : sortField;
  } else {
    sortField = sortField || "role_id";
    sortOrder = sortOrder || "ASC";
  }

  const sql = `SELECT
                a.role_id,
                a.role_name,
                a.role_department,
                b.role_name AS report_to,
                a.role_report_to,
                a.role_permissions,
                a.role_status
                FROM roles AS a
                LEFT JOIN roles AS b ON b.role_id = a.role_report_to
                WHERE a.role_status != 'Deleted'
                AND a.role_id > 1
                AND (a.role_name LIKE ? 
                    OR a.role_department LIKE ? 
                    OR b.role_name LIKE ?)
                ORDER BY a.${sortField} ${sortOrder}
                LIMIT ? OFFSET ?`;

  db.query(sql, [search, search, search, limit, offset], (err, results) => {
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

// get datas
const getLists = async (req, res, next) => {
  const sql = `SELECT
                a.role_id,
                a.role_name
                FROM roles AS a
                WHERE a.role_status = 'Active'
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

// add data
const addData = async (req, res, next) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const {
      role_name,
      role_department,
      role_report_to,
      role_permissions,
      role_status,
      working_user,
    } = req.body;

    // Check if data already exists
    const checkQuery =
      "SELECT role_id FROM roles WHERE role_name = ? AND role_status != 'Deleted'";
    db.query(checkQuery, [role_name], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Role already exists!"));
      }

      try {
        const now = getCurrentDateTime();
        const insertQuery = `INSERT INTO roles (role_name, role_department, role_report_to, role_permissions, role_status, created_on, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.query(
          insertQuery,
          [
            role_name,
            role_department,
            role_report_to,
            JSON.stringify(role_permissions),
            role_status,
            now,
            working_user,
          ],
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

    const {
      role_id,
      role_name,
      role_department,
      role_report_to,
      role_permissions,
      role_status,
      working_user,
    } = req.body;

    if (!role_id) {
      return next(new Error("Please provide role id!"));
    }

    // Check if data already exists
    const checkQuery =
      "SELECT role_id FROM roles WHERE role_name = ? AND role_id != ? AND role_status != 'Deleted'";
    db.query(checkQuery, [role_name, role_id], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Region name already exists!"));
      }

      try {
        const now = getCurrentDateTime();
        const updateQuery = `UPDATE roles SET role_name = ?, role_department = ?, role_report_to = ?, role_permissions = ?, role_status = ?, modified_on = ?, modified_by = ? WHERE role_id = ?`;

        db.query(
          updateQuery,
          [
            role_name,
            role_department,
            role_report_to,
            JSON.stringify(role_permissions),
            role_status,
            now,
            working_user,
            role_id,
          ],
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
    const { role_id, working_user } = req.body;
    const status = "Deleted";

    if (!role_id) {
      return next(new Error(valErrors.array()[0].msg));
    }

    // Check if data already exists
    const checkQuery =
      "SELECT role_id FROM roles WHERE role_id = ? AND role_status != 'Deleted'";
    db.query(checkQuery, [role_id], async (err, results) => {
      if (err) return next(new Error("Database error"));
      if (results.length > 0) {
        return next(new Error("Role usage found cannot be deleted!"));
      }

      try {
        const now = getCurrentDateTime();
        const updateQuery = `UPDATE roles SET role_status = ?, modified_on = ?, modified_by = ? WHERE role_id = ?`;

        db.query(
          updateQuery,
          [status, now, working_user, role_id],
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
  getLists,
  addData,
  editData,
  deleteData,
};
