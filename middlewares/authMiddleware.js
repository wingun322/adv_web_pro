const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "인증 토큰이 필요합니다." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded에서 사용자 ID 가져오기
    next();
  } catch (error) {
    return res.status(403).json({ error: "유효하지 않거나 만료된 토큰입니다." });
  }
};

module.exports = authMiddleware;
