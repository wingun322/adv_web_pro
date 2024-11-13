const express = require("express");
const marketController = require("../controllers/marketController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// /api/auth 라우트
router.get("/", marketController.ticker);


module.exports = router;
