// 전역 socket 객체 생성
const socket = io();

// 알림 초기화
function initializeNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '{}');
    
    // 알림 설정된 모든 채팅방 참여
    Object.keys(notifications).forEach(cryptoId => {
        if (notifications[cryptoId]) {
            socket.emit("joinRoom", cryptoId);
        }
    });

    // 메시지 수신 이벤트
    socket.on("message", (data) => {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '{}');
        
        // 채팅방에 있는 경우 메시지 표시
        if (window.location.pathname === '/chat.html') {
            const urlParams = new URLSearchParams(window.location.search);
            const currentCryptoId = urlParams.get('cryptoId');
            
            // 현재 채팅방의 메시지인 경우에만 표시
            if (currentCryptoId === data.cryptoId) {
                window.displayMessage(data);
            }
        }
        
        // 알림 설정된 경우 알림 표시 (자신의 메시지는 제외)
        if (notifications[data.cryptoId] && data.username !== username) {
            showNotification(data);
        }
    });
}

// 알림 표시
function showNotification(data) {
    if (Notification.permission === "granted") {
        // cryptoId에서 코인 이름만 추출 (예: KRW-BTC -> BTC)
        const coinName = data.cryptoId.split('-')[1];
        
        const notification = new Notification(`${coinName} 채팅방: ${data.username}님의 메시지`, {
            body: data.text,
            icon: '/favicon.ico',
            tag: 'chat-message'
        });

        notification.onclick = () => {
            window.open(`chat.html?cryptoId=${data.cryptoId}`, '_blank');
            notification.close();
        };
    }
}

// 페이지 로드 시 초기화
window.addEventListener('load', initializeNotifications); 