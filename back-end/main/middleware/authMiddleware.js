const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.authenticate = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Vui lòng đăng nhập." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.deletedAt || user.isBanned) {
      return res.status(401).json({ success: false, message: "Tài khoản không hợp lệ." });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Phiên đăng nhập đã hết hạn." });
  }
};

exports.authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Không có quyền truy cập." });
  }
  next();
};
