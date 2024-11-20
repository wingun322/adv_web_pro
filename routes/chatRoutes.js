const express = require("express");
const router = express.Router();
const { getMessagesByCryptoId, saveMessage } = require("../controllers/chatController");
const authMiddleware = require(".././middlewares/authMiddleware");

// 채팅방에 해당하는 메시지를 가져오는 라우트
router.get("/messages/:cryptoId", getMessagesByCryptoId);
router.post("/messages", authMiddleware, saveMessage);

module.exports = router;
