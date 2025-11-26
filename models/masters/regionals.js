const db = require("../../config/db");

const totalCount = async (data) => {
  return new Promise((resolve, reject) => {
    // dynamic condition
    const statusCondition = data.all
      ? "a.regional_status != 'Deleted'"
      : "a.regional_status = 'Active'";

    let query = `SELECT
                COUNT(*) AS total_count
                FROM regionals AS a
                WHERE ${statusCondition}`;
    const params = [];

    // search by name or id
    if (data.search) {
      query += " AND (a.regional_name LIKE ? OR a.regional_id LIKE ?)";
      params.push(`%${data.search}%`, `%${data.search}%`);
    }

    query += " ORDER BY a.regional_id ASC"; // default

    db.query(query, params, (err, results) => {
      if (err) {
        reject({ status: false, message: err.message });
      } else {
        resolve({ status: true, results });
      }
    });
  });
};

const allDatas = async (data) => {
  return new Promise((resolve, reject) => {
    // dynamic condition
    const statusCondition = data.all
      ? "a.regional_status != 'Deleted'"
      : "a.regional_status = 'Active'";

    let query = `SELECT
                a.regional_id,
                a.regional_name,
                a.regional_status
                FROM regionals AS a
                WHERE ${statusCondition}`;
    const params = [];

    // search by name or id
    if (data.search) {
      query += " AND (a.regional_name LIKE ? OR a.regional_id LIKE ?)";
      params.push(`%${data.search}%`, `%${data.search}%`);
    }

    // Sorting (safe column validation)
    const allowedSortFields = ["regional_name", "regional_status"];

    if (data.sortField && allowedSortFields.includes(data.sortField)) {
      const direction = data.sortOrder === "descend" ? "DESC" : "ASC";
      query += ` ORDER BY a.${data.sortField} ${direction}`;
    } else {
      query += " ORDER BY a.regional_id ASC"; // default
    }

    // Pagination
    if (data.limit !== undefined && data.limit !== null) {
      query += " LIMIT ?";
      params.push(parseInt(data.limit));
      if (data.offset !== undefined && data.offset !== null) {
        query += " OFFSET ?";
        params.push(parseInt(data.offset));
      }
    }

    db.query(query, params, (err, results) => {
      if (err) {
        reject({ status: false, message: err.message });
      } else {
        resolve({ status: true, results });
      }
    });
  });
};

module.exports = { allDatas, totalCount };
