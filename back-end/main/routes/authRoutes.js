const express        = require("express");
const router         = express.Router();
const passport       = require("../config/passport");
const AuthController = require("../controllers/AuthController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

router.post("/register",             AuthController.register);
router.post("/verify-register-otp",  AuthController.verifyRegisterOtp);
router.post("/login",                AuthController.login);
router.post("/logout",               AuthController.logout);
router.post("/refresh-token",        AuthController.refreshToken);
router.post("/forgot-password",      AuthController.forgotPassword);
router.post("/verify-otp",           AuthController.verifyOtp);
router.post("/reset-password",       AuthController.resetPassword);
router.put("/change-password",       authenticate, AuthController.changePassword);

// Google OAuth
const requireGoogleConfig = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5174"}/login?error=oauth_not_configured`);
  }
  next();
};

router.get("/google",
  requireGoogleConfig,
  passport.authenticate("google", { scope: ["profile", "email"], session: false, state: true })
);
router.get("/google/callback",
  requireGoogleConfig,
  passport.authenticate("google", {
    session:         false,
    state:           true,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5174"}/login?error=oauth_failed`,
  }),
  AuthController.googleOAuthCallback
);

// Giữ lại để tương thích — dùng /api/admin/users thay thế
router.get("/all", authenticate, authorizeAdmin, AuthController.getAllUsers);

module.exports = router;
