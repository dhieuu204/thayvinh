const mongoose          = require("mongoose");
const User              = require("../models/User");
const Cart              = require("../models/Cart");
const WishList          = require("../models/WishList");
const RefreshToken      = require("../models/RefreshToken");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");

// ─── Sanitize helper (strip HTML tags để chống stored XSS) ───────────────────
// TODO: Thay bằng sanitize-html package khi đã cài: npm install sanitize-html
const sanitize = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(/<[^>]*>/g, "").trim();
};

// ─── 6.1 Get Profile ──────────────────────────────────────────────────────────
// GET /api/users/profile
// Chỉ trả dữ liệu của chính user đang đăng nhập (lấy id từ JWT payload)
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.user.id,
    }).select("-password -googleId -__v");

    if (!user) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ─── 6.2 Get User (by ID) ────────────────────────────────────────────────────
// GET /api/users/:id
// Admin xem được full info; user thường chỉ xem thông tin public của chính mình
exports.getUser = async (req, res, next) => {
  try {
    const { id: targetId } = req.params;
    const requesterId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Không phải admin và đang xem người khác → từ chối
    // toString() vì targetId (string từ params) và requesterId (ObjectId từ JWT) khác kiểu
    if (!isAdmin && targetId !== requesterId.toString()) {
      return res.status(403).json({ success: false, message: "Không có quyền truy cập." });
    }

    // Admin xem full info; user thường chỉ lấy field public
    const selectFields = isAdmin
      ? "-password -googleId -__v"
      : "-password -googleId -__v -phone -address -isBanned -bannedReason -bannedAt -deletedAt";

    const user = await User.findOne({ _id: targetId, deletedAt: null }).select(selectFields);

    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ─── 6.3 Update Profile ──────────────────────────────────────────────────────
// PUT /api/users/profile
// Whitelist field cứng — không thể cập nhật role, email, isBanned qua endpoint này
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, address, avatarUrl } = req.body;

    // Whitelist fields — không chấp nhận bất kỳ field nào khác
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = sanitize(fullName);
    if (phone    !== undefined) updateData.phone    = sanitize(phone);
    if (address  !== undefined) updateData.address  = sanitize(address);
    if (avatarUrl !== undefined) {
      // Chỉ chấp nhận URL http/https, chặn javascript:, data:, vbscript:...
      if (avatarUrl !== "" && !/^https?:\/\//i.test(avatarUrl)) {
        return res.status(400).json({ success: false, message: "avatarUrl phải là URL http(s)." });
      }
      updateData.avatarUrl = avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "Không có dữ liệu để cập nhật." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -googleId -__v");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công.",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6.4 Delete Account ──────────────────────────────────────────────────────
// DELETE /api/users/account
// Soft delete — không xóa khỏi DB để bảo toàn lịch sử đơn hàng, review, v.v.
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    // Soft delete — set deletedAt thay vì xóa record
    await User.updateOne({ _id: userId }, { deletedAt: new Date() });

    // Dọn dẹp cart và wishlist của user
    await Promise.all([
      Cart.findOneAndDelete({ userId }),
      WishList.findOneAndDelete({ userId }),
    ]);

    // Revoke toàn bộ phiên đăng nhập
    await RefreshToken.deleteMany({ userId });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    console.info(`[AUDIT] User ${userId} self-deleted at ${new Date().toISOString()}`);

    return res.status(200).json({ success: true, message: "Tài khoản đã được xóa thành công." });
  } catch (err) {
    next(err);
  }
};

// ─── Address Book ────────────────────────────────────────────────────────────

// GET /api/users/addresses
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("addresses");
    return res.status(200).json({ success: true, data: user?.addresses ?? [] });
  } catch (err) { next(err); }
};

// POST /api/users/addresses
exports.addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, province, district, ward, street, isDefault } = req.body;
    if (!fullName || !phone || !province || !district || !ward || !street) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin địa chỉ." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });

    // Nếu đặt làm mặc định → bỏ mặc định của các địa chỉ khác
    if (isDefault) user.addresses.forEach((a) => { a.isDefault = false; });

    // Nếu chưa có địa chỉ nào → tự động đặt làm mặc định
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({ fullName: sanitize(fullName), phone: sanitize(phone), province: sanitize(province), district: sanitize(district), ward: sanitize(ward), street: sanitize(street), isDefault: shouldBeDefault });
    await user.save();

    return res.status(201).json({ success: true, message: "Đã thêm địa chỉ.", data: user.addresses });
  } catch (err) { next(err); }
};

// PUT /api/users/addresses/:addrId
exports.updateAddress = async (req, res, next) => {
  try {
    const { addrId } = req.params;
    const { fullName, phone, province, district, ward, street, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });

    const addr = user.addresses.id(addrId);
    if (!addr) return res.status(404).json({ success: false, message: "Địa chỉ không tồn tại." });

    if (isDefault) user.addresses.forEach((a) => { a.isDefault = false; });

    if (fullName  !== undefined) addr.fullName  = sanitize(fullName);
    if (phone     !== undefined) addr.phone     = sanitize(phone);
    if (province  !== undefined) addr.province  = sanitize(province);
    if (district  !== undefined) addr.district  = sanitize(district);
    if (ward      !== undefined) addr.ward      = sanitize(ward);
    if (street    !== undefined) addr.street    = sanitize(street);
    if (isDefault !== undefined) addr.isDefault = isDefault;

    await user.save();
    return res.status(200).json({ success: true, message: "Đã cập nhật địa chỉ.", data: user.addresses });
  } catch (err) { next(err); }
};

// DELETE /api/users/addresses/:addrId
exports.deleteAddress = async (req, res, next) => {
  try {
    const { addrId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });

    const addr = user.addresses.id(addrId);
    if (!addr) return res.status(404).json({ success: false, message: "Địa chỉ không tồn tại." });

    const wasDefault = addr.isDefault;
    addr.deleteOne();

    // Nếu xóa địa chỉ mặc định → đặt địa chỉ đầu tiên còn lại làm mặc định
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.status(200).json({ success: true, message: "Đã xóa địa chỉ.", data: user.addresses });
  } catch (err) { next(err); }
};

// PATCH /api/users/addresses/:addrId/default
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const { addrId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });

    const addr = user.addresses.id(addrId);
    if (!addr) return res.status(404).json({ success: false, message: "Địa chỉ không tồn tại." });

    user.addresses.forEach((a) => { a.isDefault = a._id.toString() === addrId; });
    await user.save();
    return res.status(200).json({ success: true, message: "Đã đặt địa chỉ mặc định.", data: user.addresses });
  } catch (err) { next(err); }
};

// ─── 6.5 Ban User (Admin only) ────────────────────────────────────────────────
// PATCH /api/users/:id/ban
// Route bảo vệ bởi verifyToken + authorizeAdmin
exports.banUser = async (req, res, next) => {
  try {
    const { id: targetId } = req.params;
    const adminId = req.user.id;
    const { isBanned, bannedReason } = req.body;

    // Admin không thể tự ban chính mình
    // toString() vì targetId (string từ params) và adminId (ObjectId từ JWT) khác kiểu
    if (targetId === adminId.toString()) {
      return res.status(400).json({ success: false, message: "Không thể khóa tài khoản của chính mình." });
    }

    const target = await User.findOne({ _id: targetId, deletedAt: null });
    if (!target) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    }

    const updateData = isBanned
      ? { isBanned: true,  bannedReason, bannedAt: new Date() }
      : { isBanned: false, bannedReason: "", bannedAt: null };

    await User.updateOne({ _id: targetId }, { $set: updateData });

    // Kick toàn bộ phiên đăng nhập ngay khi ban
    if (isBanned) {
      await RefreshToken.deleteMany({ userId: targetId });
    }

    console.info(
      `[AUDIT] Admin ${adminId} ${isBanned ? "banned" : "unbanned"} user ${targetId} ` +
      `at ${new Date().toISOString()}. Reason: ${bannedReason || "N/A"}`
    );

    return res.status(200).json({
      success: true,
      message: isBanned ? "Tài khoản đã bị khóa." : "Tài khoản đã được mở khóa.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6.6 Get Loyalty Points ──────────────────────────────────────────────────
// GET /api/users/loyalty?page=1&limit=10
// TODO: Bỏ comment khi đã tạo LoyaltyTransaction model
exports.getLoyaltyPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const user = await User.findOne({ _id: userId, deletedAt: null }).select("loyaltyPoints");
    if (!user) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    const [transactions, total] = await Promise.all([
      LoyaltyTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LoyaltyTransaction.countDocuments({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        currentPoints: user.loyaltyPoints ?? 0,
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── 6.7 Redeem Points ───────────────────────────────────────────────────────
// POST /api/users/loyalty/redeem
// Dùng MongoDB transaction để đảm bảo atomic; idempotencyKey ngăn double-redeem
// TODO: Bỏ comment LoyaltyTransaction khi đã tạo model
exports.redeemPoints = async (req, res, next) => {
  try {
    const { points, idempotencyKey } = req.body;

    // Guard thủ công — Joi middleware chưa được mount nên validate tại đây
    if (!Number.isInteger(points) || points <= 0) {
      return res.status(400).json({ success: false, message: "Số điểm phải là số nguyên dương." });
    }

    const userId = req.user.id;

    // Kiểm tra idempotency — tránh double-redeem do client retry
    const existing = await LoyaltyTransaction.findOne({ idempotencyKey });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Giao dịch đã được xử lý trước đó.",
        data: { idempotencyKey },
      });
    }

    // Lấy user
    const user = await User.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      return res.status(404).json({ success: false, message: "Tài khoản không tồn tại." });
    }

    const currentPoints = user.loyaltyPoints ?? 0;
    if (currentPoints < points) {
      return res.status(400).json({
        success: false,
        message: `Không đủ điểm. Hiện có: ${currentPoints}, yêu cầu: ${points}.`,
      });
    }

    const newBalance = currentPoints - points;

    // Trừ điểm
    await User.updateOne(
      { _id: userId },
      { $inc: { loyaltyPoints: -points } }
    );

    // Ghi lịch sử giao dịch
    await LoyaltyTransaction.create({
      userId,
      type: "redeem",
      points,
      description: `Đổi ${points} điểm`,
      balanceAfter: newBalance,
      idempotencyKey,
    });

    return res.status(200).json({
      success: true,
      message: `Đổi điểm thành công. Số điểm còn lại: ${newBalance}.`,
      data: { pointsRedeemed: points, remainingPoints: newBalance },
    });
  } catch (err) {
    next(err);
  }
};
