const { getChatModel } = require("../models/Chat");

// 사용자 세션 관리를 위한 Map
const userSessions = new Map();
const roomUsers = new Map(); // 방 별 사용자 목록 관리

// Socket.IO 설정 함수
function setupSocket(io) {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // 로그인 이벤트 처리
        socket.on("login", (data) => {
            const { username, userId } = data;
            console.log("Login event received:", { username, userId });
            socket.username = username; // username을 소켓에 저장
            const userKey = userId;
            
            const existingSocket = userSessions.get(userKey);
            if (existingSocket && existingSocket !== socket.id) {
                io.to(existingSocket).emit("forced_logout");
                const oldSocket = io.sockets.sockets.get(existingSocket);
                if (oldSocket) {
                    oldSocket.disconnect(true);
                }
            }
            
            userSessions.set(userKey, socket.id);
            socket.userKey = userKey;
        });

        // 암호화폐별 채팅방에 사용자 추가
        socket.on("joinRoom", (cryptoId) => {
            if (!cryptoId || !socket.username) {
                console.log("Missing cryptoId or username:", { cryptoId, username: socket.username });
                return;
            }

            console.log(`${socket.username} is joining room ${cryptoId}`);

            // 이전 방에서 나가기
            Array.from(socket.rooms).forEach(room => {
                if (room !== socket.id) {
                    socket.leave(room);
                    const users = roomUsers.get(room) || new Set();
                    users.delete(socket.username);
                    roomUsers.set(room, users);
                    io.to(room).emit("updateUserList", Array.from(users));
                }
            });

            // 새로운 방에 입장
            socket.join(cryptoId);
            const users = roomUsers.get(cryptoId) || new Set();
            users.add(socket.username);
            roomUsers.set(cryptoId, users);
            
            console.log(`Current users in room ${cryptoId}:`, Array.from(users));
            io.to(cryptoId).emit("updateUserList", Array.from(users));
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
            console.log(`Socket disconnected: ${socket.id}`);
            if (socket.username) {
                Array.from(socket.rooms).forEach(room => {
                    if (room !== socket.id) {
                        const users = roomUsers.get(room) || new Set();
                        users.delete(socket.username);
                        roomUsers.set(room, users);
                        io.to(room).emit("updateUserList", Array.from(users));
                    }
                });
            }
            userSessions.delete(socket.userKey);
        });

        // 채팅방 나가기 이벤트 추가
        socket.on("leaveRoom", (cryptoId) => {
            if (cryptoId && socket.username) {
                socket.leave(cryptoId);
                const users = roomUsers.get(cryptoId) || new Set();
                users.delete(socket.username);
                roomUsers.set(cryptoId, users);
                io.to(cryptoId).emit("updateUserList", Array.from(users));
                console.log(`${socket.username} left room ${cryptoId}`);
            }
        });
    });
}

module.exports = setupSocket;
