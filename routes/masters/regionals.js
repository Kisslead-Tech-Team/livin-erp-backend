const express = require("express");
const router = express.Router();
const {
  getDatas,
  getTotals,
  addData,
  editData,
  deleteData,
} = require("../../controllers/masters/regionals");
const { regionalValidation } = require("../../middlewares/validations");

// get totals
router.post("/gettotals", getTotals);

// get datas
router.post("/getdatas", getDatas);

// add datas
router.post("/adddata", regionalValidation, addData);

// edit datas
router.post("/editdata", regionalValidation, editData);

// edit datas
router.post("/deletedata", deleteData);

module.exports = router;
