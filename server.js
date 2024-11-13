require("dotenv").config();
const express = require("express");
const dbConnect = require("./config/dbConnect");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes"); // Import your auth routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware settings
app.use(cors());
app.use(express.json());
app.use(cookieParser());
// Serve static files
app.use(express.static("public"));

// MongoDB connection
dbConnect();

// Use the auth routes
app.use("/api/auth", authRoutes); // Prefix your routes

// Centralized error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});
