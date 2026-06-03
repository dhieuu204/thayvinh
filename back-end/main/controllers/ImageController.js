const Image = require("../models/Image");

// POST /api/images — upload ảnh
exports.upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh." });
    }

    const image = await Image.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
    });

    // URL relative — browser sẽ resolve theo origin hiện tại (local hay production)
    return res.status(201).json({
      success: true,
      data: {
        id: image._id,
        url: `/api/images/${image._id}`,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/images/:id — lấy ảnh
exports.serve = async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: "Ảnh không tồn tại." });
    }

    res.set("Content-Type", image.contentType);
    res.set("Cache-Control", "public, max-age=86400"); // cache 1 ngày
    return res.send(image.data);
  } catch (err) {
    next(err);
  }
};
