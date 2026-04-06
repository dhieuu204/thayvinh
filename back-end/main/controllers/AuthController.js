const User         = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt       = require("bcryptjs");
const jwt          = require("jsonwebtoken");
const OTP          = require("../models/Otp");
const transporter  = require("../config/mailer");

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const checkUser = await User.findOne({ $or: [{ username }, { email }] });
    if (checkUser) {
      const field = checkUser.username === username ? "Tên đăng nhập" : "Email";
      return res.status(409).json({ success: false, message: `${field} đã tồn tại.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, email });
    await user.save();

    res.status(201).json({ success: true, message: "Đăng ký thành công" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi đăng ký" });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = await User.findOne(
      email ? { email: email.toLowerCase() } : { username }
    );
    if (!user) {
      return res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: `Tài khoản đã bị khóa. Lý do: ${user.bannedReason || "Vi phạm điều khoản."}` });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token: accessToken, user: user.toJSON() });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi đăng nhập" });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ success: true, message: "Đăng xuất thành công." });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi đăng xuất" });
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
// POST /api/auth/refresh-token
// Verify refresh token từ cookie, cấp access token mới
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Không tìm thấy refresh token." });
    }

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) {
      return res.status(401).json({ success: false, message: "Refresh token không hợp lệ." });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Refresh token hết hạn hoặc không hợp lệ." });
    }

    const user = await User.findOne({ _id: payload.id, deletedAt: null });
    if (!user) {
      return res.status(401).json({ success: false, message: "Người dùng không tồn tại." });
    }
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa." });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({ success: true, token: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─── Google OAuth Callback ────────────────────────────────────────────────────
// GET /api/auth/google/callback
// Passport.js đã xử lý xác thực, controller chỉ cấp token
// TODO: Cài passport-google-oauth20 và cấu hình strategy
exports.googleOAuthCallback = async (req, res) => {
  try {
    // req.user được set bởi Passport.js GoogleStrategy
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Google xác thực thất bại." });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Redirect về frontend kèm token (hoặc set cookie tùy kiến trúc)
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    return res.redirect(`${clientUrl}/oauth-callback?token=${accessToken}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi đăng nhập Google" });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Email không tồn tại" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, code, expiresAt: Date.now() + 5 * 60 * 1000 });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Mã khôi phục mật khẩu",
      text: `Mã khôi phục của bạn là: ${code}`,
    });

    res.json({ success: true, message: "OTP đã được gửi" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi xử lý quên mật khẩu" });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;

    const otpRecord = await OTP.findOne({ email, code });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP không đúng" });
    }
    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP đã hết hạn" });
    }

    res.json({ success: true, message: "OTP hợp lệ" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi xác thực OTP" });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email, code });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP không đúng" });
    }
    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP đã hết hạn" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: "Mật khẩu đã được đặt lại thành công" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi đặt lại mật khẩu" });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng." });
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 8 ký tự." });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Đổi mật khẩu thành công." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi đổi mật khẩu" });
  }
};

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
// Giữ lại để tương thích — chức năng chính đã chuyển sang AdminController
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ deletedAt: null }).select("-password -googleId -__v");
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy danh sách user" });
  }
};
