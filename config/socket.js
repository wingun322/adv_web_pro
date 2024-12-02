const { getChatModel } = require("../models/Chat");

// 사용자 세션 관리를 위한 Map
const userSessions = new Map();

// Socket.IO 설정 함수
function setupSocket(io) {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // 로그인 이벤트 처리
        socket.on("login", (username) => {
            // 이미 로그인된 사용자인지 확인
            const existingSocket = userSessions.get(username);
            if (existingSocket && existingSocket !== socket.id) {
                // 기존 연결을 강제로 끊음
                io.to(existingSocket).emit("forced_logout");
                const oldSocket = io.sockets.sockets.get(existingSocket);
                if (oldSocket) {
                    oldSocket.disconnect(true);
                }
            }
            
            // 새로운 세션 저장
            userSessions.set(username, socket.id);
            socket.username = username;
        });

        // 암호화폐별 채팅방에 사용자 추가
        socket.on("joinRoom", (cryptoId) => {
            console.log(`Socket ${socket.id} is attempting to join room: ${cryptoId}`);
            if (!cryptoId) {
                console.error("Invalid cryptoId provided");
                return;
            }

            if ([...socket.rooms].includes(cryptoId)) {
                console.log(`Socket ${socket.id} is already in room: ${cryptoId}`);
                return;
            }

            socket.join(cryptoId);
            console.log(`Socket ${socket.id} joined room: ${cryptoId}`);
        });

        socket.on("message", async (data) => {
            const { room: cryptoId, username, text } = data;

            try {
                const Chat = getChatModel(cryptoId);
                const newMessage = new Chat({ username, text, time: new Date() });
                await newMessage.save();

                console.log(`Broadcasting message to room ${cryptoId}: ${text}`);
                io.to(cryptoId).emit("message", { 
                    cryptoId, 
                    username, 
                    text, 
                    time: newMessage.time 
                });
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        // 사용자가 연결을 끊었을 때 모든 방에서 제거
        socket.on("disconnect", () => {
            if (socket.username) {
                userSessions.delete(socket.username);
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}

module.exports = setupSocket;
