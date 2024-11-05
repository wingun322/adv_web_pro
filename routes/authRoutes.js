const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Define your routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get("/logout", authController.logout);
router.get("/user/:id", authMiddleware, authController.getUserInfo);

module.exports = router;
