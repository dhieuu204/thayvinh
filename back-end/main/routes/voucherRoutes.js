const express           = require("express");
const router            = express.Router();
const VoucherController = require("../controllers/VoucherController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

const guard = [authenticate, authorizeAdmin];

// User
router.get("/check", authenticate, VoucherController.checkVoucherCode);

// Admin
router.get("/",            ...guard, VoucherController.getAllVouchers);
router.get("/:id",         ...guard, VoucherController.getVoucherById);
router.post("/",           ...guard, VoucherController.createVoucher);
router.put("/:id",         ...guard, VoucherController.updateVoucher);
router.delete("/:id",      ...guard, VoucherController.deleteVoucher);
router.patch("/:id/toggle",...guard, VoucherController.toggleVoucher);

module.exports = router;
