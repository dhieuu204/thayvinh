const express          = require("express");
const router           = express.Router();
const AdminController  = require("../controllers/AdminController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

const guard = [authenticate, authorizeAdmin];

// ── Thống kê ──────────────────────────────────────────────────────────────────
router.get("/stats/overview",         ...guard, AdminController.getOverview);
router.get("/stats/revenue",          ...guard, AdminController.getRevenueStats);
router.get("/stats/top-products",     ...guard, AdminController.getTopProducts);
router.get("/stats/top-customers",    ...guard, AdminController.getTopCustomers);
router.get("/stats/categories",       ...guard, AdminController.getCategoryStats);
router.get("/stats/low-stock",        ...guard, AdminController.getLowStockAlert);
router.get("/stats/orders-by-status", ...guard, AdminController.getOrdersByStatus);

// ── Quản lý đơn hàng ──────────────────────────────────────────────────────────
router.get("/orders",                      ...guard, AdminController.getAllOrders);
router.patch("/orders/:orderId/status",    ...guard, AdminController.updateOrderStatus);

// ── Quản lý user ──────────────────────────────────────────────────────────────
router.get("/users",           ...guard, AdminController.getAllUsers);
router.patch("/users/:id/ban", ...guard, AdminController.banUser);

// ── Quản lý banner ────────────────────────────────────────────────────────────
router.get("/banners",        ...guard, AdminController.getBanners);
router.post("/banners",       ...guard, AdminController.createBanner);
router.put("/banners/:id",    ...guard, AdminController.updateBanner);
router.delete("/banners/:id", ...guard, AdminController.deleteBanner);

// ── Quản lý flash sale ────────────────────────────────────────────────────────
router.get("/flash-sales",        ...guard, AdminController.getFlashSales);
router.post("/flash-sales",       ...guard, AdminController.createFlashSale);
router.put("/flash-sales/:id",    ...guard, AdminController.updateFlashSale);
router.delete("/flash-sales/:id", ...guard, AdminController.deleteFlashSale);

module.exports = router;
