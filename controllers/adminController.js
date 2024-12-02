const User = require('../models/User');
const { getChatModel } = require('../models/Chat');
const mongoose = require('mongoose');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users: " + error.message });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
        await User.findByIdAndDelete(userId);
        res.json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user: " + error.message });
    }
};

// Get all chat rooms
exports.getAllChats = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const chatRooms = collections.map(col => col.name).filter(name => name !== 'users');
        res.json({ chats: chatRooms });
    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        res.status(500).json({ error: "Failed to fetch chat rooms: " + error.message });
    }
};

// Delete a chat room
exports.deleteChat = async (req, res) => {
    const { chatId } = req.params;
    try {
        const Chat = getChatModel(chatId);
        await Chat.deleteMany(); // Deletes all messages in the chat room
        res.json({ message: "Chat room deleted successfully." });
    } catch (error) {
        console.error("Error deleting chat room:", error);
        res.status(500).json({ error: "Failed to delete chat room: " + error.message });
    }
};