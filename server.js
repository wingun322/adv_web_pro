require("dotenv").config();
const express = require("express");
const dbConnect = require("./config/dbConnect");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const marketRoutes = require("./routes/marketRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const PORT = process.env.PORT || 8080;

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
app.use("/api/admin", adminRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// HTTP server setup
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server);

// Socket.IO configuration
const setupSocket = require("./config/socket");
setupSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});