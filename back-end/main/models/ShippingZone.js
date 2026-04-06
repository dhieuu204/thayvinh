const mongoose = require("mongoose");

const shippingZoneSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true },      // Tên tỉnh/thành phố
    code:           { type: String, required: true, unique: true, uppercase: true }, // VD: "HN", "HCM"
    fee:            { type: Number, required: true, min: 0 },  // Phí vận chuyển (VND)
    estimatedDays:  { type: Number, required: true, min: 1 },  // Số ngày dự kiến giao
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingZone", shippingZoneSchema);
