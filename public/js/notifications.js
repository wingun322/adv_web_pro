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
        const username = localStorage.getItem('username');
        if (notifications[data.cryptoId] && data.username !== username) {
            showToast(data);
        }
    });
}

// 토스트 알림 표시
function showToast(data) {
    // 기존 토스트 제거
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach((toast, index) => {
        toast.style.bottom = `${20 + (index * 70)}px`; // 토스트 간격 조정
    });

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    // cryptoId에서 코인 이름만 추출 (예: KRW-BTC -> BTC)
    const coinName = data.cryptoId.split('-')[1];
    toast.innerHTML = `
        <strong>${coinName} 채팅방</strong><br>
        ${data.username}: ${data.text}
    `;
    
    document.body.appendChild(toast);
    
    // 토스트 클릭 시 현재 탭에서 채팅방으로 이동
    toast.addEventListener('click', () => {
        window.location.href = `chat.html?cryptoId=${data.cryptoId}`;
    });
    
    // 3초 후 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            // 남은 토스트들의 위치 재조정
            const remainingToasts = document.querySelectorAll('.toast-notification');
            remainingToasts.forEach((toast, index) => {
                toast.style.bottom = `${20 + (index * 70)}px`;
            });
        }, 500);
    }, 3000);
}

// 페이지 로드 시 초기화
window.addEventListener('load', initializeNotifications);