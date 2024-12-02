const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    deleteUser,
    getAllChats,
    deleteChat
} = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware'); // Ensure the user is authenticated
const adminMiddleware = require('../middlewares/adminMiddleware'); // Ensure the user is an admin

// Get all users
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

// Delete a user
router.delete('/users/:userId', authMiddleware, adminMiddleware, deleteUser);

// Get all chat rooms
router.get('/chats', authMiddleware, adminMiddleware, getAllChats);

// Delete a chat room
router.delete('/chats/:chatId', authMiddleware, adminMiddleware, deleteChat);

module.exports = router;
