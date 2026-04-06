const express            = require("express");
const router             = express.Router();
const PaymentController  = require("../controllers/PaymentController");
const { authenticate }   = require("../middleware/authMiddleware");

router.post("/vnpay/create",   authenticate, PaymentController.createVNPayUrl);
router.get("/vnpay/return",                  PaymentController.vnpayReturn);
router.get("/status/:orderId", authenticate, PaymentController.getPaymentStatus);

module.exports = router;
