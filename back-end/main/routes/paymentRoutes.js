const express            = require("express");
const router             = express.Router();
const PaymentController  = require("../controllers/PaymentController");
const { authenticate }   = require("../middleware/authMiddleware");

router.post("/vnpay/create",   authenticate, PaymentController.createVNPayUrl);
router.get("/vnpay/return",                  PaymentController.vnpayReturn);

router.post("/momo/create",    authenticate, PaymentController.createMoMoPayment);
router.post("/momo/ipn",                     PaymentController.momoIPN);
router.get("/momo/return",                   PaymentController.momoReturn);

router.get("/status/:orderId", authenticate, PaymentController.getPaymentStatus);

module.exports = router;
