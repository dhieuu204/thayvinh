const express             = require("express");
const router              = express.Router();
const ShippingController  = require("../controllers/ShippingController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

const guard = [authenticate, authorizeAdmin];

// Public / User
router.get("/fee",              ShippingController.calculateShippingFee);
router.get("/zones",            ShippingController.getShippingZones);
router.get("/track/:trackingCode", ShippingController.trackOrder);

// Admin
router.post("/zones",           ...guard, ShippingController.createShippingZone);
router.put("/zones/:id",        ...guard, ShippingController.updateShippingZone);
router.delete("/zones/:id",     ...guard, ShippingController.deleteShippingZone);

module.exports = router;
