const express = require("express");
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

// 채팅 메시지 관련 라우트
router.get('/messages/:cryptoId', authMiddleware, chatController.getMessagesByCryptoId);
router.post('/messages/:cryptoId', authMiddleware, chatController.saveMessage);
router.delete('/messages/:cryptoId/:messageId', authMiddleware, chatController.deleteMessage);

module.exports = router;
