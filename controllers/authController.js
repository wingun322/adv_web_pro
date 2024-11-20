const User = require("../models/User");
const jwt = require("jsonwebtoken");

// 토큰 생성 함수
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// 회원가입
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "이미 사용 중인 이메일입니다." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "이미 사용 중인 유저네임입니다." });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json({ message: "회원가입 성공" });
  } catch (error) {
    console.error('회원가입 실패:', error);  // 에러 로그 추가
    res.status(400).json({ error: "회원가입 실패: " + error.message });
  }
};

// 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "사용자를 찾을 수 없습니다" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "잘못된 비밀번호" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "strict" });
    res.json({ message: "로그인 성공", accessToken });
  } catch (error) {
    res.status(500).json({ error: "로그인 실패: " + error.message });
  }
};

// 리프레시 토큰으로 새 엑세스 토큰 발급
exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "리프레시 토큰이 필요합니다." });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded.id);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ error: "유효하지 않은 리프레시 토큰입니다." });
  }
};

// 로그아웃
exports.logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "로그아웃 성공. 클라이언트 측에서 토큰을 삭제하세요." });
};

//유저 정보 가져오기
exports.getUserInfo = async (req, res) => {
  const userId = req.user.id; // Get the user ID from req.user set by authMiddleware
  try {
    const user = await User.findById(userId).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });

    res.json({ user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "정보를 가져오는 데 실패했습니다: " + error.message });
  }
};