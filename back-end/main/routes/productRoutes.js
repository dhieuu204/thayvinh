const express           = require("express");
const router            = express.Router();
const ProductController = require("../controllers/ProductController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

const guard = [authenticate, authorizeAdmin];

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/",                       ProductController.getAll);
router.get("/search",                 ProductController.search);
router.get("/flash-sales",            ProductController.getFlashSales);
router.get("/filter/category",        ProductController.filterByCategory);
router.get("/filter/price",           ProductController.filterByPrice);
router.get("/:id",                    ProductController.getById);
router.get("/:id/variants",           ProductController.getVariants);
router.get("/:id/related",            ProductController.getRelated);

// ── User (đăng nhập) ─────────────────────────────────────────────────────────
router.post("/:id/notify-restock",    authenticate, ProductController.notifyRestock);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post("/",                      ...guard, ProductController.createProduct);
router.put("/:id",                    ...guard, ProductController.updateProduct);
router.delete("/:id",                 ...guard, ProductController.deleteProduct);
router.get("/:id/restock-subscribers",...guard, ProductController.getRestockSubscribers);

module.exports = router;
