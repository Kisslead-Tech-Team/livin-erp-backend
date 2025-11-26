const { body } = require("express-validator");

// superadmin details
exports.superAdminValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// login details
exports.loginValidation = [
  body("email").isEmail().withMessage("Enter valid email id").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password too short"),
];

// regional details
exports.regionalValidation = [
  body("regional_name").notEmpty().withMessage("Name is required"),
  body("working_user")
    .isInt()
    .withMessage("User is required and must be an integer"),
];

// role details
exports.roleValidation = [
  body("role_name").notEmpty().withMessage("Name is required"),
  body("role_department").notEmpty().withMessage("Department is required"),
  body("role_report_to").isInt().withMessage("Report to is required"),
  body("working_user")
    .isInt()
    .withMessage("User is required and must be an integer"),
];

// ----------------------------------------------------------

// user details
exports.userValidation = [
  body("user_name").notEmpty().withMessage("Name is required"),
  body("user_email").isEmail().withMessage("Invalid email"),
  body("user_password")
    .if((value, { req }) => !req.body.user_id)
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("user_branch").notEmpty().withMessage("Branch is required"),
  body("user_team").notEmpty().withMessage("Team is required"),
  body("user_role").notEmpty().withMessage("Role is required"),
  body("report_to")
    .isInt()
    .withMessage("Report Person is required and must be an integer"),
  body("user_status")
    .isInt()
    .withMessage("Status is required and must be an integer"),
  body("working_user")
    .isInt()
    .withMessage("User is required and must be an integer"),
];
