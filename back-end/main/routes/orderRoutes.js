const express          = require("express");
const router           = express.Router();
const OrderController  = require("../controllers/OrderController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

// User
router.post("/",                        authenticate, OrderController.createOrder);
router.get("/my",                       authenticate, OrderController.getMyOrders);
router.patch("/:orderId/cancel",        authenticate, OrderController.cancelOrder);
router.post("/:orderId/return",         authenticate, OrderController.createReturnRequest);
router.delete("/:orderId",              authenticate, OrderController.deleteOrder);

// Admin
router.get("/returns",                  authenticate, authorizeAdmin, OrderController.getReturnRequests);
router.patch("/returns/:returnId/approve", authenticate, authorizeAdmin, OrderController.approveReturn);
router.patch("/returns/:returnId/reject",  authenticate, authorizeAdmin, OrderController.rejectReturn);

module.exports = router;
