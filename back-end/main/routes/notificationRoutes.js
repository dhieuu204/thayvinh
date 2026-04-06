const express                  = require("express");
const router                   = express.Router();
const NotificationController   = require("../controllers/NotificationController");
const { authenticate }         = require("../middleware/authMiddleware");

router.get("/",                     authenticate, NotificationController.getNotifications);
router.get("/unread-count",         authenticate, NotificationController.getUnreadCount);
router.patch("/read-all",           authenticate, NotificationController.markAllAsRead);
router.patch("/:notificationId/read", authenticate, NotificationController.markAsRead);

module.exports = router;
