const Voucher      = require("../models/Voucher");
const VoucherUsage = require("../models/VoucherUsage");

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — Quản lý Voucher
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Get All Vouchers ─────────────────────────────────────────────────────────
// GET /api/vouchers?page=1&limit=20&isActive=true
exports.getAllVouchers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { deletedAt: null };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const [vouchers, total] = await Promise.all([
      Voucher.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Voucher.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        vouchers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Voucher By ID ────────────────────────────────────────────────────────
// GET /api/vouchers/:id
exports.getVoucherById = async (req, res, next) => {
  try {
    const voucher = await Voucher.findOne({ _id: req.params.id, deletedAt: null });
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher không tồn tại." });
    }
    return res.status(200).json({ success: true, data: voucher });
  } catch (err) {
    next(err);
  }
};

// ─── Create Voucher ───────────────────────────────────────────────────────────
// POST /api/vouchers
exports.createVoucher = async (req, res, next) => {
  try {
    const { code, type, value, minOrderValue, maxDiscount, usageLimit, startsAt, expiresAt } = req.body;

    if (!code || !type || value === undefined || !startsAt || !expiresAt) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }
    if (!["percent", "fixed"].includes(type)) {
      return res.status(400).json({ success: false, message: "Loại voucher không hợp lệ (percent/fixed)." });
    }
    if (type === "percent" && (value <= 0 || value > 100)) {
      return res.status(400).json({ success: false, message: "Giá trị phần trăm phải từ 1 đến 100." });
    }
    if (new Date(startsAt) >= new Date(expiresAt)) {
      return res.status(400).json({ success: false, message: "Thời gian bắt đầu phải trước thời gian kết thúc." });
    }

    const existing = await Voucher.findOne({ code: code.toUpperCase(), deletedAt: null });
    if (existing) {
      return res.status(409).json({ success: false, message: "Mã voucher đã tồn tại." });
    }

    const voucher = await Voucher.create({
      code: code.toUpperCase(),
      type,
      value,
      minOrderValue: minOrderValue ?? 0,
      maxDiscount: maxDiscount ?? null,
      usageLimit: usageLimit ?? null,
      startsAt: new Date(startsAt),
      expiresAt: new Date(expiresAt),
    });

    return res.status(201).json({ success: true, message: "Tạo voucher thành công.", data: voucher });
  } catch (err) {
    next(err);
  }
};

// ─── Update Voucher ───────────────────────────────────────────────────────────
// PUT /api/vouchers/:id
exports.updateVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findOne({ _id: req.params.id, deletedAt: null });
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher không tồn tại." });
    }

    // Không cho sửa code sau khi tạo để tránh nhầm lẫn lịch sử sử dụng
    const { type, value, minOrderValue, maxDiscount, usageLimit, startsAt, expiresAt } = req.body;

    const finalType  = type  !== undefined ? type  : voucher.type;
    const finalValue = value !== undefined ? value : voucher.value;
    if (finalType === "percent" && (finalValue <= 0 || finalValue > 100)) {
      return res.status(400).json({ success: false, message: "Giá trị phần trăm phải từ 1 đến 100." });
    }
    if (type !== undefined) voucher.type = type;
    if (value !== undefined) voucher.value = value;
    if (minOrderValue !== undefined) voucher.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) voucher.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) voucher.usageLimit = usageLimit;
    if (startsAt !== undefined) voucher.startsAt = new Date(startsAt);
    if (expiresAt !== undefined) voucher.expiresAt = new Date(expiresAt);

    await voucher.save();
    return res.status(200).json({ success: true, message: "Cập nhật voucher thành công.", data: voucher });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Voucher (Soft Delete) ─────────────────────────────────────────────
// DELETE /api/vouchers/:id
exports.deleteVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findOne({ _id: req.params.id, deletedAt: null });
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher không tồn tại." });
    }

    await Voucher.updateOne({ _id: req.params.id }, { deletedAt: new Date(), isActive: false });
    return res.status(200).json({ success: true, message: "Đã xóa voucher." });
  } catch (err) {
    next(err);
  }
};

// ─── Toggle Voucher Active ────────────────────────────────────────────────────
// PATCH /api/vouchers/:id/toggle
exports.toggleVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findOne({ _id: req.params.id, deletedAt: null });
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher không tồn tại." });
    }

    voucher.isActive = !voucher.isActive;
    await voucher.save();

    return res.status(200).json({
      success: true,
      message: `Voucher đã ${voucher.isActive ? "kích hoạt" : "tắt"}.`,
      data: { isActive: voucher.isActive },
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER — Kiểm tra Voucher
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Check Voucher Code ───────────────────────────────────────────────────────
// GET /api/vouchers/check?code=SUMMER20
// Trả về thông tin voucher nếu hợp lệ (chưa lưu vào cart)
exports.checkVoucherCode = async (req, res, next) => {
  try {
    const { code } = req.query;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập mã voucher." });
    }

    const now = new Date();
    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      isActive: true,
      deletedAt: null,
      startsAt: { $lte: now },
      expiresAt: { $gt: now },
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Mã voucher không hợp lệ hoặc đã hết hạn." });
    }
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ success: false, message: "Mã voucher đã hết lượt sử dụng." });
    }

    const alreadyUsed = await VoucherUsage.findOne({ voucherId: voucher._id, userId });
    if (alreadyUsed) {
      return res.status(400).json({ success: false, message: "Bạn đã sử dụng mã voucher này rồi." });
    }

    return res.status(200).json({
      success: true,
      data: {
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        minOrderValue: voucher.minOrderValue,
        maxDiscount: voucher.maxDiscount,
        expiresAt: voucher.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
};
