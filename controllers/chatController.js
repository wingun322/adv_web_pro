const { getChatModel } = require("../models/Chat");

exports.getMessagesByCryptoId = async (req, res) => {
    const { cryptoId } = req.params;
    try {
        const Chat = getChatModel(cryptoId);
        const messages = await Chat.find().sort({ time: 1 }).lean();
        res.json({ messages });
    } catch (error) {
        console.error("Error occurred while fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages: " + error.message });
    }
};

exports.saveMessage = async (req, res) => {
    const { cryptoId, username, text, time } = req.body;

    try {
        // 해당 cryptoId로 컬렉션 가져오기
        const Chat = getChatModel(cryptoId);

        // 메시지 저장
        const newMessage = new Chat({ username, text, time: time || new Date() });
        await newMessage.save();

        res.status(201).json({ message: "Message saved successfully" });
    } catch (error) {
        console.error("Error occurred while saving message:", error);
        res.status(500).json({ error: "Failed to save message: " + error.message });
    }
};

exports.deleteMessage = async (req, res) => {
    const { cryptoId, messageId } = req.params;
    try {
        const Chat = getChatModel(cryptoId);
        console.log("Chat:", Chat);
        const result = await Chat.findByIdAndDelete(messageId);
        console.log("Result:", result);
        
        if (!result) {
            return res.status(404).json({ error: "Message not found." });
        }

        res.json({ message: "Message deleted successfully." });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Failed to delete message: " + error.message });
    }
};
