const express = require("express");
const router = express.Router();
const {
  getDatas,
  getTotals,
  getLists,
  addData,
  editData,
  deleteData,
} = require("../../controllers/masters/roles");
const { roleValidation } = require("../../middlewares/validations");

// get totals
router.post("/gettotals", getTotals);

// get datas
router.post("/getdatas", getDatas);

// get lists
router.post("/getlists", getLists);

// add datas
router.post("/adddata", roleValidation, addData);

// edit datas
router.post("/editdata", roleValidation, editData);

// edit datas
router.post("/deletedata", deleteData);

module.exports = router;
