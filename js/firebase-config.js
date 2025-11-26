/* ========================================
   Firebase Configuration
   ======================================== */

// TODO: Firebase Console에서 프로젝트 생성 후 아래 값들을 교체하세요
// https://console.firebase.google.com 에서:
// 1. 새 프로젝트 생성 (예: marketing-curriculum)
// 2. Authentication > 로그인 방법 > 이메일/비밀번호 활성화
// 3. Firestore Database > 데이터베이스 만들기 > 테스트 모드로 시작
// 4. 프로젝트 설정 > 일반 > 내 앱 > 웹 앱 추가 > 설정 복사

const firebaseConfig = {
    apiKey: "AIzaSyBovmzRjIxlnHcDA5RL6KQTqURlRM_4pMc",
    authDomain: "marketing-curriculum.firebaseapp.com",
    projectId: "marketing-curriculum",
    storageBucket: "marketing-curriculum.firebasestorage.app",
    messagingSenderId: "533665413706",
    appId: "1:533665413706:web:c5e834fd9d5a69b35104b3"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// 서비스 참조
const auth = firebase.auth();
const db = firebase.firestore();

// 언어 설정
auth.languageCode = 'ko';

/* ========================================
   인증 관련 함수
   ======================================== */

// 이메일/비밀번호 회원가입
async function signUpWithEmail(email, password, displayName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // 사용자 프로필 업데이트
        await user.updateProfile({ displayName: displayName });
        
        // Firestore에 사용자 정보 저장
        await db.collection('users').doc(user.uid).set({
            email: email,
            displayName: displayName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'student'
        });
        
        // 진행 상황 초기화
        await db.collection('progress').doc(user.uid).set({
            completedDays: [],
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// 이메일/비밀번호 로그인
async function signInWithEmail(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// Google 로그인
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // 신규 사용자인 경우 Firestore에 정보 저장
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'student'
            });
            
            await db.collection('progress').doc(user.uid).set({
                completedDays: [],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// 로그아웃
async function signOut() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// 에러 메시지 한국어 변환
function getErrorMessage(error) {
    const errorMessages = {
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
        'auth/operation-not-allowed': '이메일/비밀번호 로그인이 비활성화되어 있습니다.',
        'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
        'auth/user-disabled': '비활성화된 계정입니다.',
        'auth/user-not-found': '등록되지 않은 이메일입니다.',
        'auth/wrong-password': '잘못된 비밀번호입니다.',
        'auth/popup-closed-by-user': '로그인이 취소되었습니다.',
        'auth/network-request-failed': '네트워크 오류가 발생했습니다.'
    };
    return errorMessages[error.code] || error.message;
}

/* ========================================
   진행 상황 관련 함수
   ======================================== */

// 진행 상황 불러오기
async function loadProgress(userId) {
    try {
        const doc = await db.collection('progress').doc(userId).get();
        if (doc.exists) {
            return doc.data().completedDays || [];
        }
        return [];
    } catch (error) {
        console.error('Error loading progress:', error);
        return [];
    }
}

// 진행 상황 저장
async function saveProgress(userId, completedDays) {
    try {
        await db.collection('progress').doc(userId).set({
            completedDays: completedDays,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error saving progress:', error);
        return { success: false, error: error.message };
    }
}

// Day 완료 토글
async function toggleDayCompletion(userId, dayIndex) {
    try {
        const progressRef = db.collection('progress').doc(userId);
        const doc = await progressRef.get();
        let completedDays = doc.exists ? (doc.data().completedDays || []) : [];
        
        if (completedDays.includes(dayIndex)) {
            completedDays = completedDays.filter(d => d !== dayIndex);
        } else {
            completedDays.push(dayIndex);
        }
        
        await progressRef.set({
            completedDays: completedDays,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        return { success: true, completedDays: completedDays };
    } catch (error) {
        console.error('Error toggling day:', error);
        return { success: false, error: error.message };
    }
}

/* ========================================
   관리자 관련 함수
   ======================================== */

// 모든 사용자 정보 가져오기
async function getAllUsersWithProgress() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const progressDoc = await db.collection('progress').doc(userDoc.id).get();
            const progressData = progressDoc.exists ? progressDoc.data() : { completedDays: [] };
            
            users.push({
                id: userDoc.id,
                ...userData,
                progress: progressData.completedDays || [],
                lastUpdated: progressData.lastUpdated
            });
        }
        
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// 관리자 여부 확인
async function isAdmin(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            return doc.data().role === 'admin';
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// 사용자를 관리자로 설정 (최초 설정용)
async function setAsAdmin(userId) {
    try {
        await db.collection('users').doc(userId).update({
            role: 'admin'
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ========================================
   실시간 업데이트 리스너
   ======================================== */

// 진행 상황 실시간 리스너
function subscribeToProgress(userId, callback) {
    return db.collection('progress').doc(userId).onSnapshot(doc => {
        if (doc.exists) {
            callback(doc.data().completedDays || []);
        }
    });
}

// 모든 사용자 진행 상황 실시간 리스너 (관리자용)
function subscribeToAllProgress(callback) {
    return db.collection('progress').onSnapshot(async snapshot => {
        const users = await getAllUsersWithProgress();
        callback(users);
    });
}
