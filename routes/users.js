const express = require("express");
const router = express.Router();
const {
  getUserData,
  login,
  registerSuperAdmin,
  addUser,
  editUser,
  getAllUsers,
  getReportToPersons,
} = require("../controllers/users");
const {
  loginValidation,
  userValidation,
  superAdminValidation,
} = require("../middlewares/validations");

// register superadmin details
router.post("/registersuperadmin", superAdminValidation, registerSuperAdmin);

// login check and get user details
router.post("/login", loginValidation, login);

// get user details
router.get("/getuserdata", getUserData);
// ---------------------

// add user details
router.post("/adduser", userValidation, addUser);

// edit user details
router.post("/edituser", userValidation, editUser);

// get all users details
router.post("/getallusers", getAllUsers);

// get report to persons details
router.post("/getreporttopersons", getReportToPersons);

module.exports = router;
