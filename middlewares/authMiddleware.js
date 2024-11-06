const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "토큰이 필요합니다." });
  }

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(400).json({ error: "유효하지 않은 인증 헤더 형식입니다." });
  }

  const token = tokenParts[1];

  try {
    // Verify the token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT secret is not defined.");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Attach user ID to request
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Token verification failed:", error); // Log the error for debugging
    res.status(403).json({ error: "유효하지 않은 토큰입니다." });
  }
};

module.exports = authMiddleware;
