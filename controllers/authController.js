const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { sendVerificationCode } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { getChatModel } = require("../models/Chat");
const mongoose = require('mongoose');

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
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    const newUser = new User({
      username,
      email,
      password,
      verificationCode,
      verificationCodeExpires,
      isAdmin: username === "test" // Set isAdmin to true if username is "test"
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
  const { email, verificationCode } = req.body;
  console.log("Received email:", email);
  console.log("Received code:", verificationCode);
  try {
    const user = await User.findOne({
      email,
      verificationCode: verificationCode,
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
    res.json({ 
      message: "Login successful", 
      accessToken,
      username: user.username,
      userId: user._id
    });
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

    res.json({ user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user info: " + error.message });
  }
};

// 인증 코드 확인
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "유효하지 않거나 만료된 인증 코드입니다." });
    }

    // 인증 성공 시 처리
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

// 회원 정보 수정
exports.updateUserInfo = async (req, res) => {
    const { username, email } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (username) {
            const existingUsername = await User.findOne({ 
                username, 
                _id: { $ne: userId } 
            });
            
            if (existingUsername) {
                return res.status(400).json({ error: "Username already in use." });
            }

            // 모든 채팅방 컬렉션 가져오기
            const collections = await mongoose.connection.db.listCollections().toArray();
            const cryptoIds = collections
                .map(col => col.name)
                .filter(name => name !== 'users'); // users 컬렉션 제외

            // 각 채팅방의 메시지 업데이트
            for (const cryptoId of cryptoIds) {
                const Chat = getChatModel(cryptoId);
                await Chat.updateMany(
                    { username: user.username },
                    { $set: { username: username } }
                );
            }
            
            user.username = username;
        }

        if (email) {
            const existingEmail = await User.findOne({ 
                email,
                _id: { $ne: userId } 
            });
            
            if (existingEmail) {
                return res.status(400).json({ error: "Email already in use." });
            }
            user.email = email;
        }

        await user.save();
        res.json({ message: "User information updated successfully." });
    } catch (error) {
        console.error("Error updating user info:", error);
        res.status(500).json({ error: "Failed to update user information: " + error.message });
    }
};

// 비밀번호 수정
exports.updatePassword = async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id; // authMiddleware에서 설정한 사용자 ID

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // 비밀번호 해싱
        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ error: "Failed to update password: " + error.message });
    }
};

// Send verification code
exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Generate a verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save the verification code and its expiration time
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료
        await user.save();

        // Send verification code using emailService
        await sendVerificationCode(email, verificationCode);

        res.json({ message: "인증번호가 이메일로 전송되었습니다." });
    } catch (error) {
        console.error("Error sending verification code:", error);
        res.status(500).json({ error: "인증번호 전송에 실패했습니다: " + error.message });
    }
};

exports.getMessagesByCryptoId = async (req, res) => {
    const { cryptoId } = req.params;
    console.log("Received cryptoId:", cryptoId);

    try {
        // 해당 cryptoId로 컬렉션 가져오기
        const Chat = getChatModel(cryptoId);

        // 채팅방의 메시지 가���오기
        const messages = await Chat.find({});

        res.json({ messages });
    } catch (error) {
        console.error("Error getting messages:", error);
        res.status(500).json({ error: "Failed to get messages: " + error.message });
    }
};

exports.addFavorite = async (req, res) => {
  const { cryptoId } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    
    if (!user.favorites.includes(cryptoId)) {
      user.favorites.push(cryptoId);
      await user.save();
      return res.status(200).json({ message: "즐겨찾기에 추가되었습니다." });
    }
    return res.status(400).json({ error: "이미 즐겨찾기에 추가된 암호화폐입니다." });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "즐겨찾기 추가 중 오류가 발생했습니다." });
  }
};

exports.removeFavorite = async (req, res) => {
  const { cryptoId } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const index = user.favorites.indexOf(cryptoId);
    
    if (index > -1) {
      user.favorites.splice(index, 1);
      await user.save();
      return res.status(200).json({ message: "즐겨찾기에서 제거되었습니다." });
    }
    return res.status(400).json({ error: "즐겨찾기에 없는 암호화폐입니다." });
  } catch (error) {
    res.status(500).json({ error: "즐겨찾기 제거 중 오류가 발생했습니다." });
  }
};

exports.getFavorites = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate('favorites');
    res.status(200).json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: "즐겨찾기 조회 중 오류가 발생했습니다." });
  }
};