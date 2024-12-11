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
router.post("/verify-code", authController.verifyEmail);
router.post("/verifycode", authMiddleware, authController.verifyCode);
router.post("/resend-code", authController.resendVerificationCode);
router.post("/check-username", authController.checkUsername);
router.post("/check-email", authController.checkEmail);
router.put("/update", authMiddleware, authController.updateUserInfo);
router.put("/update-password", authMiddleware, authController.updatePassword);
router.post('/send-verification-code', authController.sendVerificationCode);
router.post('/sendverificationcode',authMiddleware, authController.sendVerificationCode);
router.post("/favorites/add", authMiddleware, authController.addFavorite);
router.post("/favorites/remove", authMiddleware, authController.removeFavorite);
router.get("/favorites", authMiddleware, authController.getFavorites);

module.exports = router;
