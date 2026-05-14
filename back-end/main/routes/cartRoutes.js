const express        = require("express");
const router         = express.Router();
const CartController = require("../controllers/CartController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/view",           authenticate, CartController.viewCart);
router.post("/add",           authenticate, CartController.addToCart);
router.put("/update",         authenticate, CartController.updateCart);
router.delete("/remove",      authenticate, CartController.removeFromCart);
router.delete("/clear",       authenticate, CartController.clearCart);
router.post("/merge",         authenticate, CartController.mergeCart);
router.post("/voucher",       authenticate, CartController.applyVoucher);
router.delete("/voucher",     authenticate, CartController.removeVoucher);

module.exports = router;
