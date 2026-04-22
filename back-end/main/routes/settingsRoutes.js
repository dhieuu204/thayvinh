const express         = require("express");
const router          = express.Router();
const AdminController = require("../controllers/AdminController");

// Public — frontend dùng để lấy homepage layout
router.get("/homepage-layout", AdminController.getHomepageLayout);

module.exports = router;
