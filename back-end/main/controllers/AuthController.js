const User         = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt       = require("bcryptjs");
const jwt          = require("jsonwebtoken");
const OTP          = require("../models/Otp");
const transporter  = require("../config/mailer");

// ─── Register — bước 1: gửi OTP, chưa tạo user ───────────────────────────────
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu." });
    }

    const existing = await User.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email đã tồn tại." });
    }

    // Xóa OTP cũ (nếu có) rồi tạo mới
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: "register" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({
      email:     email.toLowerCase(),
      code,
      purpose:   "register",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
    });

    await transporter.sendMail({
      from:    process.env.MAIL_USER,
      to:      email,
      subject: "Mã xác minh đăng ký tài khoản",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#1d1d1f">Xác minh tài khoản</h2>
          <p>Mã xác minh của bạn là:</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1d1d1f;margin:20px 0">${code}</div>
          <p style="color:#6e6e73;font-size:13px">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với ai.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Mã OTP đã được gửi đến email của bạn." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi đăng ký" });
  }
};

// ─── Verify Register OTP — bước 2: xác minh OTP, tạo user, auto-login ────────
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, code, password, name } = req.body;

    const otpRecord = await OTP.findOne({ email: email?.toLowerCase(), code, purpose: "register" });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Mã OTP không đúng." });
    }
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn." });
    }

    // Kiểm tra email active (race condition)
    const active = await User.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (active) {
      return res.status(409).json({ success: false, message: "Email đã tồn tại." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Nếu tài khoản đã bị soft-delete → reactivate thay vì tạo mới
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.password   = hashedPassword;
      user.fullName   = name || user.fullName;
      user.isVerified = true;
      user.deletedAt  = null;
      // Không reset isBanned — banned user không được tự unban qua re-register
      user.googleId   = null;
      await user.save();
    } else {
      user = await User.create({
        email:      email.toLowerCase(),
        password:   hashedPassword,
        fullName:   name || "",
        isVerified: true,
      });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    // Auto-login — cấp token ngay
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ success: true, token: accessToken, user: user.toJSON() });
  } catch (err) {
    console.error("Verify register OTP error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi xác minh OTP" });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const safeEmail    = email    ? String(email).toLowerCase()    : null;
    const safeUsername = username ? String(username)               : null;

    const user = await User.findOne(
      safeEmail ? { email: safeEmail } : { username: safeUsername }
    ).select("+password +googleId");
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

    const emailVerified = user.isVerified;

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
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

    res.json({ success: true, token: accessToken, user: user.toJSON(), emailVerified });
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
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
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

    // Rotate: xóa token cũ, cấp token mới — leaked refresh token sống tối đa 1 lần
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await stored.deleteOne();
    await RefreshToken.create({ userId: user._id, token: newRefreshToken, expiresAt });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true, token: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─── Google OAuth Callback ────────────────────────────────────────────────────
exports.googleOAuthCallback = async (req, res) => {
  try {
    const user = req.user; // set bởi Passport GoogleStrategy
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5174"}/login?error=oauth_failed`);
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
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

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5174";
    // Không truyền token qua URL (Referer/history leak) — dùng httpOnly cookie
    // Frontend đọc cookie hoặc gọi /api/users/profile để lấy user info
    return res.redirect(`${clientUrl}/oauth-callback`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5174"}/login?error=server_error`);
  }
};


// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const safeEmail = String(email || "").toLowerCase();

    const user = await User.findOne({ email: safeEmail });
    // Luôn trả message generic để tránh enumeration oracle
    if (!user) {
      return res.json({ success: true, message: "Nếu email tồn tại, mã OTP đã được gửi." });
    }

    await OTP.deleteMany({ email: safeEmail, purpose: "reset" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email: safeEmail, code, purpose: "reset", expiresAt: Date.now() + 5 * 60 * 1000 });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: safeEmail,
      subject: "Mã khôi phục mật khẩu",
      text: `Mã khôi phục của bạn là: ${code}`,
    });

    res.json({ success: true, message: "Nếu email tồn tại, mã OTP đã được gửi." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi xử lý quên mật khẩu" });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    const safeEmail = String(email || "").toLowerCase();

    const otpRecord = await OTP.findOne({ email: safeEmail, code, purpose: "reset" });
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
    const safeEmail = String(email || "").toLowerCase();

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 8 ký tự." });
    }

    const otpRecord = await OTP.findOne({ email: safeEmail, code, purpose: "reset" });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP không đúng" });
    }
    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP đã hết hạn" });
    }

    const user = await User.findOne({ email: safeEmail }).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await OTP.deleteOne({ _id: otpRecord._id });
    await RefreshToken.deleteMany({ userId: user._id });

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
    const user = await User.findById(req.user.id).select("+password");
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
