const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// /api/auth 라우트
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/user", authMiddleware, authController.getUserInfo);
router.post("/verify-code", authController.verifyCode);
router.post("/resend-code", authController.resendVerificationCode);
router.post("/check-username", authController.checkUsername);
router.post("/check-email", authController.checkEmail);
router.put("/update", authMiddleware, authController.updateUserInfo);
router.put("/update-password", authMiddleware, authController.updatePassword);
router.post('/send-verification-code', authController.sendVerificationCode);

module.exports = router;
