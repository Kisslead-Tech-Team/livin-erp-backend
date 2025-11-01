const express = require("express");
const {
  getAllBranch,
  getActiveBranchs,
  getActiveTeams,
  getActiveRoles,
} = require("../controllers/masters");
const router = express.Router();

// get all users details
router.post("/getallbranch", getAllBranch);

// get active branchs details
router.post("/getactivebranchs", getActiveBranchs);

// get active teams details
router.post("/getactiveteams", getActiveTeams);

// get active roles details
router.post("/getactiveroles", getActiveRoles);

module.exports = router;
