const ShippingZone = require("../models/ShippingZone");

// ─── Calculate Shipping Fee ───────────────────────────────────────────────────
// GET /api/shipping/fee?provinceCode=HN
exports.calculateShippingFee = async (req, res, next) => {
  try {
    const { provinceCode } = req.query;

    if (!provinceCode) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp mã tỉnh/thành phố." });
    }

    const zone = await ShippingZone.findOne({
      code: provinceCode.toUpperCase(),
      isActive: true,
    });

    if (!zone) {
      return res.status(404).json({ success: false, message: "Khu vực vận chuyển không được hỗ trợ." });
    }

    return res.status(200).json({
      success: true,
      data: {
        provinceCode: zone.code,
        provinceName: zone.name,
        fee: zone.fee,
        estimatedDays: zone.estimatedDays,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Shipping Zones ───────────────────────────────────────────────────────
// GET /api/shipping/zones
exports.getShippingZones = async (req, res, next) => {
  try {
    const zones = await ShippingZone.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: zones });
  } catch (err) {
    next(err);
  }
};

// ─── Create Shipping Zone (Admin) ─────────────────────────────────────────────
// POST /api/shipping/zones
exports.createShippingZone = async (req, res, next) => {
  try {
    const { name, code, fee, estimatedDays } = req.body;

    if (!name || !code || fee === undefined || !estimatedDays) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    const existing = await ShippingZone.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Mã khu vực đã tồn tại." });
    }

    const zone = await ShippingZone.create({
      name,
      code: code.toUpperCase(),
      fee,
      estimatedDays,
    });

    return res.status(201).json({ success: true, message: "Tạo khu vực vận chuyển thành công.", data: zone });
  } catch (err) {
    next(err);
  }
};

// ─── Update Shipping Zone (Admin) ─────────────────────────────────────────────
// PUT /api/shipping/zones/:id
exports.updateShippingZone = async (req, res, next) => {
  try {
    const zone = await ShippingZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: "Khu vực vận chuyển không tồn tại." });
    }

    const { name, fee, estimatedDays, isActive } = req.body;
    if (name !== undefined) zone.name = name;
    if (fee !== undefined) zone.fee = fee;
    if (estimatedDays !== undefined) zone.estimatedDays = estimatedDays;
    if (isActive !== undefined) zone.isActive = isActive;

    await zone.save();
    return res.status(200).json({ success: true, message: "Cập nhật khu vực vận chuyển thành công.", data: zone });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Shipping Zone (Admin) ─────────────────────────────────────────────
// DELETE /api/shipping/zones/:id
exports.deleteShippingZone = async (req, res, next) => {
  try {
    const zone = await ShippingZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: "Khu vực vận chuyển không tồn tại." });
    }

    await zone.deleteOne();
    return res.status(200).json({ success: true, message: "Đã xóa khu vực vận chuyển." });
  } catch (err) {
    next(err);
  }
};

// ─── Track Order ──────────────────────────────────────────────────────────────
// GET /api/shipping/track/:trackingCode
// Gọi GHN API nếu có, hoặc trả stub
exports.trackOrder = async (req, res, next) => {
  try {
    const { trackingCode } = req.params;

    if (!trackingCode) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp mã vận đơn." });
    }

    // TODO: Tích hợp GHN API
    // const GHN_API_KEY = process.env.GHN_API_KEY;
    // const response = await fetch(`https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail`, {
    //   method: "POST",
    //   headers: { "Token": GHN_API_KEY, "Content-Type": "application/json" },
    //   body: JSON.stringify({ order_code: trackingCode }),
    // });
    // const data = await response.json();
    // return res.status(200).json({ success: true, data: data.data });

    return res.status(503).json({
      success: false,
      message: "Tính năng theo dõi đơn hàng qua GHN đang được tích hợp.",
      trackingCode,
    });
  } catch (err) {
    next(err);
  }
};
