const Notification = require("../models/Notification");

// ─── Get Notifications ────────────────────────────────────────────────────────
// GET /api/notifications?page=1&limit=20&unreadOnly=true
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { userId };
    if (unreadOnly === "true") filter.isRead = false;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
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

// ─── Get Unread Count ─────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    return res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

// ─── Mark As Read ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/:notificationId/read
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Thông báo không tồn tại." });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({ success: true, message: "Đã đánh dấu đã đọc." });
  } catch (err) {
    next(err);
  }
};

// ─── Mark All As Read ─────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    const now = new Date();
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: now }
    );
    return res.status(200).json({ success: true, message: "Đã đánh dấu tất cả là đã đọc." });
  } catch (err) {
    next(err);
  }
};
