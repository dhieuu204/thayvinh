const express        = require("express");
const router         = express.Router();
const UserController = require("../controllers/UserController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

router.get("/profile",                           authenticate, UserController.getProfile);
router.put("/profile",                           authenticate, UserController.updateProfile);
router.delete("/account",                        authenticate, UserController.deleteAccount);
router.get("/loyalty",                           authenticate, UserController.getLoyaltyPoints);
router.post("/loyalty/redeem",                   authenticate, UserController.redeemPoints);

// Address Book
router.get("/addresses",                         authenticate, UserController.getAddresses);
router.post("/addresses",                        authenticate, UserController.addAddress);
router.put("/addresses/:addrId",                 authenticate, UserController.updateAddress);
router.delete("/addresses/:addrId",              authenticate, UserController.deleteAddress);
router.patch("/addresses/:addrId/default",       authenticate, UserController.setDefaultAddress);

router.get("/:id",                               authenticate, UserController.getUser);
router.patch("/:id/ban",                         authenticate, authorizeAdmin, UserController.banUser);

module.exports = router;
