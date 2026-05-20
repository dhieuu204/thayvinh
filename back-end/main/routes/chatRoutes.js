const express = require("express");
const router = express.Router();
const { sendMessage } = require("../controllers/ChatController");

router.post("/message", sendMessage);

module.exports = router;
