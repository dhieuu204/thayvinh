const express = require("express");
const router = express.Router();
const ImageController = require("../controllers/ImageController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");

// POST /api/images — upload ảnh (cần auth)
router.post("/", authenticate, uploadSingle, ImageController.upload);

// GET /api/images/:id — lấy ảnh (public)
router.get("/:id", ImageController.serve);

module.exports = router;
