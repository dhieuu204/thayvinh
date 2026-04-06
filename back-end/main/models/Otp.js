const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code:  { type: String, required: true },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index — MongoDB tự xóa khi hết hạn
  },
});

module.exports = mongoose.model('OTP', otpSchema);
