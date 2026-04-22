const express         = require("express");
const router          = express.Router();
const AdminController = require("../controllers/AdminController");

// Public — storefront dùng để lấy banners theo position
router.get("/", AdminController.getBanners);

module.exports = router;
