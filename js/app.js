/* ========================================
   Marketing Curriculum App
   ======================================== */

// 전역 변수
let currentUser = null;
let completedDays = [];
let unsubscribeProgress = null;

/* ========================================
   초기화
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    // 인증 상태 변경 리스너
    auth.onAuthStateChanged(async (user) => {
        hideLoading();
        
        if (user) {
            currentUser = user;
            
            // 학습 페이지인 경우
            if (document.getElementById('curriculum-page')) {
                showUserNav(user);
                await initializeCurriculum(user);
            }
            
            // 로그인 페이지에서 이미 로그인된 경우 리다이렉트
            if (document.getElementById('login-page')) {
                window.location.href = 'index.html';
            }
        } else {
            currentUser = null;
            
            // 학습 페이지에서 로그아웃된 경우 로그인 페이지로
            if (document.getElementById('curriculum-page')) {
                window.location.href = 'login.html';
            }
        }
    });
});

/* ========================================
   UI 함수
   ======================================== */

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.classList.remove('show');
    }
}

function showUserNav(user) {
    const userNav = document.getElementById('userNav');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userNav) {
        userNav.style.display = 'flex';
        if (userName) {
            userName.innerHTML = `<strong>${user.displayName || '사용자'}</strong>님 환영합니다`;
        }
        if (userAvatar) {
            userAvatar.textContent = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
        }
    }
}

/* ========================================
   로그인 관련 함수
   ======================================== */

async function handleLogin(event) {
    event.preventDefault();
    hideError('loginError');
    showLoading();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = await signInWithEmail(email, password);
    hideLoading();
    
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        showError('loginError', result.error);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    hideError('signupError');
    showLoading();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (password.length < 6) {
        hideLoading();
        showError('signupError', '비밀번호는 6자 이상이어야 합니다.');
        return;
    }
    
    const result = await signUpWithEmail(email, password, name);
    hideLoading();
    
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        showError('signupError', result.error);
    }
}

async function handleGoogleLogin() {
    hideError('loginError');
    hideError('signupError');
    showLoading();
    
    const result = await signInWithGoogle();
    hideLoading();
    
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        showError('loginError', result.error);
        showError('signupError', result.error);
    }
}

async function handleLogout() {
    showLoading();
    
    // 리스너 정리
    if (unsubscribeProgress) {
        unsubscribeProgress();
        unsubscribeProgress = null;
    }
    
    const result = await signOut();
    hideLoading();
    
    if (result.success) {
        window.location.href = 'login.html';
    }
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignupForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

/* ========================================
   커리큘럼 관련 함수
   ======================================== */

async function initializeCurriculum(user) {
    // 초기 잠금 상태 먼저 적용 (Day 1만 열림)
    applyProgress();
    
    // 실시간 진행 상황 리스너 설정
    unsubscribeProgress = subscribeToProgress(user.uid, (days) => {
        completedDays = days;
        applyProgress();
    });
    
    // Day 1 기본 열기
    const firstCard = document.querySelector('.day-card[data-day="1"]');
    if (firstCard) {
        firstCard.classList.add('active');
    }
}

function applyProgress() {
    const checkboxes = document.querySelectorAll('.day-checkbox');
    
    checkboxes.forEach((cb, index) => {
        const dayCard = cb.closest('.day-card');
        
        // 완료 상태 적용
        if (completedDays.includes(index)) {
            cb.checked = true;
            dayCard.classList.add('completed');
        } else {
            cb.checked = false;
            dayCard.classList.remove('completed');
        }
        
        // 잠금 상태 적용 (이전 Day 완료해야 열림)
        if (index === 0) {
            // Day 1은 항상 열림
            dayCard.classList.remove('locked');
        } else if (completedDays.includes(index - 1)) {
            // 이전 Day 완료했으면 열림
            dayCard.classList.remove('locked');
        } else {
            // 이전 Day 미완료면 잠금
            dayCard.classList.add('locked');
        }
    });
    
    updateProgressBar();
}

function updateProgressBar() {
    const total = document.querySelectorAll('.day-checkbox').length;
    const completed = completedDays.length;
    const percentage = (completed / total) * 100;
    
    const progressFill = document.getElementById('progressFill');
    const progressCount = document.getElementById('progressCount');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    if (progressCount) {
        progressCount.textContent = completed + ' / ' + total + ' 완료';
    }
}

function toggleDay(header) {
    const card = header.closest('.day-card');
    
    // 잠긴 카드는 열 수 없음
    if (card.classList.contains('locked')) {
        alert('이전 Day를 먼저 완료해주세요! ✏️');
        return;
    }
    
    const wasActive = card.classList.contains('active');
    
    // 다른 카드 닫기
    document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
    
    // 현재 카드 토글
    if (!wasActive) {
        card.classList.add('active');
    }
}

async function handleCheckboxClick(event, checkbox) {
    event.stopPropagation();
    
    if (!currentUser) {
        checkbox.checked = !checkbox.checked;
        return;
    }
    
    const dayCard = checkbox.closest('.day-card');
    const dayIndex = Array.from(document.querySelectorAll('.day-checkbox')).indexOf(checkbox);
    
    // 즉시 UI 업데이트
    if (checkbox.checked) {
        dayCard.classList.add('completed');
    } else {
        dayCard.classList.remove('completed');
    }
    
    // Firebase에 저장
    const result = await toggleDayCompletion(currentUser.uid, dayIndex);
    
    if (!result.success) {
        // 실패 시 롤백
        checkbox.checked = !checkbox.checked;
        if (checkbox.checked) {
            dayCard.classList.add('completed');
        } else {
            dayCard.classList.remove('completed');
        }
    }
}

/* ========================================
   페이지 전환
   ======================================== */

window.toggleDay = toggleDay;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;
window.handleCheckboxClick = handleCheckboxClick;
