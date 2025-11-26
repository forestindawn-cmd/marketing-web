/* ========================================
   Admin Dashboard
   ======================================== */

let adminUser = null;
let allUsers = [];
let unsubscribeUsers = null;

const TOTAL_DAYS = 30;

/* ========================================
   초기화
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(async (user) => {
        hideLoading();
        
        if (user) {
            // 관리자 권한 확인
            const adminStatus = await isAdmin(user.uid);
            
            if (adminStatus) {
                adminUser = user;
                initializeAdmin();
            } else {
                // 관리자가 아닌 경우 메인 페이지로 리다이렉트
                alert('관리자 권한이 필요합니다.');
                window.location.href = 'index.html';
            }
        } else {
            // 로그인되지 않은 경우 로그인 페이지로
            window.location.href = 'login.html';
        }
    });
});

/* ========================================
   관리자 초기화
   ======================================== */

async function initializeAdmin() {
    // 실시간 업데이트 리스너 설정
    unsubscribeUsers = subscribeToAllProgress((users) => {
        allUsers = users;
        renderDashboard();
    });
}

/* ========================================
   대시보드 렌더링
   ======================================== */

function renderDashboard() {
    renderStats();
    renderUserCards();
}

function renderStats() {
    const totalUsers = allUsers.length;
    const totalCompleted = allUsers.reduce((sum, user) => sum + (user.progress?.length || 0), 0);
    const avgProgress = totalUsers > 0 ? Math.round((totalCompleted / (totalUsers * TOTAL_DAYS)) * 100) : 0;
    const fullyCompleted = allUsers.filter(user => (user.progress?.length || 0) >= TOTAL_DAYS).length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('avgProgress').textContent = avgProgress + '%';
    document.getElementById('totalCompleted').textContent = totalCompleted;
    document.getElementById('fullyCompleted').textContent = fullyCompleted;
}

function renderUserCards() {
    const container = document.getElementById('usersGrid');
    
    if (!container) return;
    
    if (allUsers.length === 0) {
        container.innerHTML = `
            <div class="user-card" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
                <p style="color: var(--medium-gray);">등록된 수강생이 없습니다.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allUsers.map(user => {
        const completed = user.progress?.length || 0;
        const percentage = Math.round((completed / TOTAL_DAYS) * 100);
        const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
        const lastActive = user.lastUpdated ? formatDate(user.lastUpdated.toDate()) : '활동 없음';
        const joinDate = user.createdAt ? formatDate(user.createdAt.toDate()) : '-';
        
        return `
            <div class="user-card">
                <div class="user-card-header">
                    <div class="user-card-avatar">${initial}</div>
                    <div class="user-card-info">
                        <h3>${user.displayName || '이름 없음'}</h3>
                        <p>${user.email}</p>
                    </div>
                </div>
                
                <div class="user-progress">
                    <div class="user-progress-header">
                        <span class="user-progress-label">학습 진행률</span>
                        <span class="user-progress-value">${completed}/${TOTAL_DAYS} (${percentage}%)</span>
                    </div>
                    <div class="user-progress-bar">
                        <div class="user-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                
                <div class="days-grid">
                    ${renderDaysDots(user.progress || [])}
                </div>
                
                <div class="user-meta">
                    <span>가입: ${joinDate}</span>
                    <span>최근 활동: ${lastActive}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderDaysDots(progress) {
    let html = '';
    for (let i = 0; i < TOTAL_DAYS; i++) {
        const isCompleted = progress.includes(i);
        html += `<div class="day-dot ${isCompleted ? 'completed' : ''}">${i + 1}</div>`;
    }
    return html;
}

function formatDate(date) {
    if (!date) return '-';
    const now = new Date();
    const diff = now - date;
    
    // 1시간 이내
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return minutes <= 1 ? '방금 전' : `${minutes}분 전`;
    }
    
    // 24시간 이내
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}시간 전`;
    }
    
    // 7일 이내
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}일 전`;
    }
    
    // 그 외
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

/* ========================================
   유틸리티
   ======================================== */

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

async function handleLogout() {
    if (unsubscribeUsers) {
        unsubscribeUsers();
    }
    
    await signOut();
    window.location.href = 'login.html';
}

// 관리자 설정 (최초 1회 사용 - 콘솔에서 실행)
// setAsAdmin('USER_UID_HERE');

window.handleLogout = handleLogout;
