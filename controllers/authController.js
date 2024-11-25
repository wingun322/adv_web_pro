const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { sendVerificationCode } = require('../utils/emailService');

// Token generation functions
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// 6자리 인증 코드 생성 함수
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register user
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use." });
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    const newUser = new User({
      username,
      email,
      password,
      verificationCode,
      verificationCodeExpires
    });

    await newUser.save();
    await sendVerificationCode(email, verificationCode);

    res.status(201).json({ 
      message: "Registration successful. Please check your email for verification code.",
      email: email
    });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(400).json({ error: "Registration failed: " + error.message });
  }
};

// 이메일 인증 처리
exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification code." });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ error: "Email verification failed: " + error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    if (!user.isVerified) {
      return res.status(400).json({ 
        error: "Please verify your email before logging in." 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect password" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "strict" });
    res.json({ message: "Login successful", accessToken });
  } catch (error) {
    res.status(500).json({ error: "Login failed: " + error.message });
  }
};

// Refresh token
exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "Refresh token required." });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded.id);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ error: "Invalid refresh token." });
  }
};

// Logout user
exports.logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logout successful. Please remove the token on the client side." });
};

// Get user info
exports.getUserInfo = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    res.json({ user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user info: " + error.message });
  }
};

// 인증 코드 확인
exports.verifyCode = async (req, res) => {
  const { email, verificationCode } = req.body;
  
  try {
    const user = await User.findOne({
      email,
      verificationCode,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "잘못된 인증 코드이거나 만료되었습니다." });
    }

    // 인증 완료 처리
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: "이메일 인증이 완료되었습니다." });
  } catch (error) {
    res.status(500).json({ error: "인증 처리 중 오류가 발생했습니다: " + error.message });
  }
};

// 인증 코드 재전송
exports.resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 새로운 인증 코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10분
    await user.save();

    // 이메일 발송
    await sendVerificationCode(email, verificationCode);

    res.json({ message: "인증 코드가 재전송되었습니다." });
  } catch (error) {
    res.status(500).json({ error: "인증 코드 재전송 중 오류가 발생했습니다: " + error.message });
  }
};

// 유저네임 중복 확인
exports.checkUsername = async (req, res) => {
    try {
        const { username } = req.body;
        const existingUser = await User.findOne({ username });
        
        if (existingUser) {
            return res.status(400).json({ error: "이미 사용 중인 유저네임입니다." });
        }
        
        res.json({ message: "사용 가능한 유저네임입니다." });
    } catch (error) {
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
};

// 이메일 중복 확인
exports.checkEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ error: "이미 사용 중인 이메일입니다." });
        }
        
        res.json({ message: "사용 가능한 이메일입니다." });
    } catch (error) {
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
};