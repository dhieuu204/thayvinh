const express        = require("express");
const router         = express.Router();
const AuthController = require("../controllers/AuthController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

router.post("/register",        AuthController.register);
router.post("/login",           AuthController.login);
router.post("/logout",          AuthController.logout);
router.post("/refresh-token",   AuthController.refreshToken);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-otp",      AuthController.verifyOtp);
router.post("/reset-password",  AuthController.resetPassword);
router.put("/change-password",  authenticate, AuthController.changePassword);
router.get("/google/callback",  AuthController.googleOAuthCallback);

// Giữ lại để tương thích — dùng /api/admin/users thay thế
router.get("/all", authenticate, authorizeAdmin, AuthController.getAllUsers);

module.exports = router;
