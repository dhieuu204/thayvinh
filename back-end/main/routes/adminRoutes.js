const express          = require("express");
const router           = express.Router();
const AdminController      = require("../controllers/AdminController");
const CategoryController   = require("../controllers/CategoryController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

const guard = [authenticate, authorizeAdmin];

// ── Thống kê ──────────────────────────────────────────────────────────────────
router.get("/stats/overview",         ...guard, AdminController.getOverview);
router.get("/stats/revenue",          ...guard, AdminController.getRevenueStats);
router.get("/stats/by-category",      ...guard, AdminController.getStatsByCategory);
router.get("/stats/top-products",     ...guard, AdminController.getTopProducts);
router.get("/stats/top-customers",    ...guard, AdminController.getTopCustomers);
router.get("/stats/categories",       ...guard, AdminController.getCategoryStats);
router.get("/stats/low-stock",        ...guard, AdminController.getLowStockAlert);
router.get("/stats/orders-by-status", ...guard, AdminController.getOrdersByStatus);

// ── Quản lý đơn hàng ──────────────────────────────────────────────────────────
router.get("/orders",                      ...guard, AdminController.getAllOrders);
router.get("/orders/:orderId",             ...guard, AdminController.getOrderById);
router.patch("/orders/:orderId/status",    ...guard, AdminController.updateOrderStatus);

// ── Quản lý user ──────────────────────────────────────────────────────────────
router.get("/users",           ...guard, AdminController.getAllUsers);
router.patch("/users/:id/ban", ...guard, AdminController.banUser);

// ── Quản lý banner ────────────────────────────────────────────────────────────
router.get("/banners",        ...guard, AdminController.getBanners);
router.post("/banners",       ...guard, AdminController.createBanner);
router.put("/banners/:id",    ...guard, AdminController.updateBanner);
router.delete("/banners/:id", ...guard, AdminController.deleteBanner);

// ── Quản lý danh mục (all, kể cả inactive) ───────────────────────────────────
router.get("/categories", ...guard, CategoryController.getAllAdmin);

// ── Homepage layout ───────────────────────────────────────────────────────────
router.get("/homepage-layout",  ...guard, AdminController.getHomepageLayout);
router.put("/homepage-layout",  ...guard, AdminController.updateHomepageLayout);

// ── Quản lý flash sale ────────────────────────────────────────────────────────
router.get("/flash-sales",                              ...guard, AdminController.getFlashSales);
router.post("/flash-sales",                             ...guard, AdminController.createFlashSale);
router.put("/flash-sales/:id",                          ...guard, AdminController.updateFlashSale);
router.patch("/flash-sales/:id/products",              ...guard, AdminController.addProductToFlashSale);
router.delete("/flash-sales/:id/products/:productId",  ...guard, AdminController.removeProductFromFlashSale);
router.delete("/flash-sales/:id",                       ...guard, AdminController.deleteFlashSale);

module.exports = router;
