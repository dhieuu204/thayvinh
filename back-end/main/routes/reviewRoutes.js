const express          = require("express");
const router           = express.Router();
const ReviewController = require("../controllers/ReviewController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

// User
router.post("/",                           authenticate, ReviewController.createReview);
router.get("/",                            authenticate, authorizeAdmin, ReviewController.getAllReviews);
router.get("/product/:productId",                        ReviewController.getReviewsByProduct);
router.put("/:reviewId",                   authenticate, ReviewController.updateReview);
router.delete("/:reviewId",               authenticate, ReviewController.deleteReview);

// Admin
router.patch("/:reviewId/reply",           authenticate, authorizeAdmin, ReviewController.replyReview);
router.delete("/:reviewId/admin",          authenticate, authorizeAdmin, ReviewController.deleteAnyReview);

module.exports = router;
