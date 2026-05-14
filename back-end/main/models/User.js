const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
      select: false, // không trả password trừ khi query có +password
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    googleId: {
      type: String,
      default: null,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ─── Profile ──────────────────────────────────────────────────────────────
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },

    // ─── Loyalty Points ───────────────────────────────────────────────────────
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Ban ──────────────────────────────────────────────────────────────────
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedReason: {
      type: String,
      default: '',
    },
    bannedAt: {
      type: Date,
      default: null,
    },

    // ─── Address Book ─────────────────────────────────────────────────────────
    addresses: [
      {
        fullName:  { type: String, trim: true, default: "" },
        phone:     { type: String, trim: true, default: "" },
        province:  { type: String, trim: true, default: "" },
        district:  { type: String, trim: true, default: "" },
        ward:      { type: String, trim: true, default: "" },
        street:    { type: String, trim: true, default: "" },
        isDefault: { type: Boolean, default: false },
      },
    ],

    // ─── Soft Delete ──────────────────────────────────────────────────────────
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ẩn các field nhạy cảm khi serialize ra JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    delete ret.googleId;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
