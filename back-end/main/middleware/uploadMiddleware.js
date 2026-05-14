const multer = require("multer");
const path   = require("path");

const storage = multer.memoryStorage();

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXT  = /\.(jpe?g|png|webp|gif)$/i;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh .jpg/.png/.webp/.gif."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

exports.uploadSingle = upload.single("image");
exports.uploadMultiple = upload.array("images", 5);
