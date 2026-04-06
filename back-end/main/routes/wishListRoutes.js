const express            = require("express");
const router             = express.Router();
const WishlistController = require("../controllers/WishListController");
const { authenticate }   = require("../middleware/authMiddleware");

router.get("/",             authenticate, WishlistController.viewWishList);
router.post("/",            authenticate, WishlistController.addToWishList);
router.delete("/",          authenticate, WishlistController.removeFromWishList);
router.post("/add-all",     authenticate, WishlistController.addAll);

module.exports = router;
