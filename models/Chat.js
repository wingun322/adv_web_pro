const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

const models = {};

const getChatModel = (cryptoId) => {
    if (!models[cryptoId]) {
        models[cryptoId] = mongoose.model(cryptoId, chatSchema);
    }
    return models[cryptoId];
};

module.exports = { getChatModel };
