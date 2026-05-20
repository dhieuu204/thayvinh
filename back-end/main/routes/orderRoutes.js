const express          = require("express");
const router           = express.Router();
const OrderController  = require("../controllers/OrderController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

// Static routes trước — tránh bị /:orderId nuốt
router.get("/my",                          authenticate, OrderController.getMyOrders);
router.get("/returns",                     authenticate, authorizeAdmin, OrderController.getReturnRequests);
router.patch("/returns/:returnId/approve", authenticate, authorizeAdmin, OrderController.approveReturn);
router.patch("/returns/:returnId/reject",  authenticate, authorizeAdmin, OrderController.rejectReturn);

// Dynamic routes sau
router.post("/",                          authenticate, OrderController.createOrder);
router.get("/:orderId",                   authenticate, OrderController.getOrderById);
router.patch("/:orderId/cancel",          authenticate, OrderController.cancelOrder);
router.post("/:orderId/return",           authenticate, OrderController.createReturnRequest);
router.patch("/:orderId/confirm-payment", authenticate, authorizeAdmin, OrderController.confirmPayment);
router.patch("/:orderId/mark-refunded",   authenticate, authorizeAdmin, OrderController.markRefunded);
router.delete("/:orderId",                authenticate, authorizeAdmin, OrderController.deleteOrder);

module.exports = router;
