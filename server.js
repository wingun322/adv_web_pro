require("dotenv").config();
const express = require("express");
const dbConnect = require("./config/dbConnect");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const marketRoutes = require("./routes/marketRoutes");
const chatRoutes = require("./routes/chatRoutes");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware settings
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// MongoDB connection
dbConnect();

// Use the auth and market routes
app.use("/api/auth", authRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/chat", chatRoutes);


// Centralized error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// HTTP 서버 설정
const server = http.createServer(app);

// Socket.IO 설정
const io = socketIo(server);

// Socket.IO 관련 설정을 별도의 파일에서 처리하도록 변경
const setupSocket = require("./config/socket");  // 반드시 올바른 경로로 import
setupSocket(io); // io 객체를 `socket.js`에 전달하여 설정

// 서버 시작
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});