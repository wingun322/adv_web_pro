const { getChatModel } = require("../models/Chat");

exports.getMessagesByCryptoId = async (req, res) => {
    const { cryptoId } = req.params;
    console.log("Received cryptoId:", cryptoId);

    try {
        // 해당 cryptoId로 컬렉션 가져오기
        const Chat = getChatModel(cryptoId);

        // 모든 메시지를 시간순으로 정렬해서 가져오기
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
