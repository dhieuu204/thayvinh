const express            = require("express");
const router             = express.Router();
const CategoryController = require("../controllers/CategoryController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

const guard = [authenticate, authorizeAdmin];

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/",                    CategoryController.getAll);
router.get("/:id",                 CategoryController.getById);
router.get("/:id/products",        CategoryController.getProductsByCategory);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post("/",                   ...guard, CategoryController.create);
router.put("/:id",                 ...guard, CategoryController.update);
router.delete("/:id",              ...guard, CategoryController.delete);

module.exports = router;
