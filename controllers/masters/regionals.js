const db = require("../../config/db");
const { validationResult } = require("express-validator");
const { getCurrentDateTime } = require("../../utilities/functions");
const { allDatas, totalCount } = require("../../models/masters/regionals");

// get totals
const getTotals = async (req, res, next) => {
  try {
    const { search, all } = req.body;

    const results = await totalCount({
      search,
      all,
    });

    if (!results.status) {
      return next(new Error(results.message || "Internal server error"));
    }

    const datas = results.results;

    if (!datas.length) {
      return next(new Error("No Data Available"));
    }

    res.json({
      status: true,
      message: "Datas retrieved successfully",
      data: datas[0].total_count,
    });
  } catch (err) {
    console.error(err);
    return next(new Error(err.message || "Error fetching data"));
  }
};

const getDatas = async (req, res, next) => {
  try {
    const { limit, offset, search, all, sortField, sortOrder } = req.body;

    const results = await allDatas({
      limit: parseInt(limit) || 10,
      offset: parseInt(offset) || 0,
      search,
      all,
      sortField,
      sortOrder,
    });

    if (!results.status) {
      return next(new Error(results.message || "Internal server error"));
    }

    const datas = results.results;

    if (!datas.length) {
      return next(new Error("No Data Available"));
    }

    res.json({
      status: true,
      message: "Datas retrieved successfully",
      data: datas,
    });
  } catch (err) {
    console.error(err);
    return next(new Error(err.message || "Error fetching data"));
  }
};

// add data
const addData = async (req, res, next) => {
  try {
    const valErrors = validationResult(req);
    if (!valErrors.isEmpty()) {
      return next(new Error(valErrors.array()[0].msg));
    }

    const { regional_name, regional_status, working_user } = req.body;

    // Check if data already exists
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

    if (!regional_id) {
      return next(new Error("Please provide region id!"));
    }

    // Check if data already exists
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

    // Check if data already exists
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
