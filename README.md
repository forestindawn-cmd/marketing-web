# 마케팅 마스터 커리큘럼 🎓

30일 마케팅 마스터 커리큘럼 - Firebase 연동 + 관리자 대시보드

## 📁 파일 구조

```
marketing-curriculum/
├── index.html          # 메인 학습 페이지
├── login.html          # 로그인/회원가입 페이지
├── admin.html          # 관리자 대시보드
├── firestore.rules     # Firebase 보안 규칙
├── css/
│   └── styles.css      # 통합 스타일시트
└── js/
    ├── firebase-config.js  # Firebase 설정 및 함수
    ├── app.js              # 메인 앱 로직
    └── admin.js            # 관리자 대시보드 로직
```

---

## 🔥 Firebase 설정 가이드

### 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름 입력 (예: `marketing-curriculum`)
4. Google Analytics 비활성화 (선택사항)
5. **"프로젝트 만들기"** 클릭

### 2단계: 웹 앱 추가

1. 프로젝트 대시보드에서 **"웹"** 아이콘 (</>) 클릭
2. 앱 닉네임 입력 (예: `marketing-web`)
3. **"Firebase Hosting 설정"** 체크 해제
4. **"앱 등록"** 클릭
5. 표시되는 설정값 복사

### 3단계: firebase-config.js 수정

`js/firebase-config.js` 파일을 열고 아래 값들을 교체:

```javascript
const firebaseConfig = {
    apiKey: "여기에_API_KEY",
    authDomain: "프로젝트ID.firebaseapp.com",
    projectId: "프로젝트ID",
    storageBucket: "프로젝트ID.appspot.com",
    messagingSenderId: "숫자",
    appId: "앱ID"
};
```

### 4단계: Authentication 설정

1. Firebase Console → **"Authentication"** 메뉴
2. **"시작하기"** 클릭
3. **"Sign-in method"** 탭
4. **"이메일/비밀번호"** 활성화
5. (선택) **"Google"** 활성화

### 5단계: Firestore Database 설정

1. Firebase Console → **"Firestore Database"** 메뉴
2. **"데이터베이스 만들기"** 클릭
3. **"테스트 모드에서 시작"** 선택
4. 위치 선택 (asia-northeast3 = 서울)
5. **"사용 설정"** 클릭

### 6단계: 보안 규칙 적용

1. Firestore → **"규칙"** 탭
2. `firestore.rules` 파일 내용 복사 붙여넣기
3. **"게시"** 클릭

---

## 🚀 GitHub Pages 배포

### 1단계: GitHub 저장소 생성

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/marketing-curriculum.git
git push -u origin main
```

### 2단계: GitHub Pages 활성화

1. GitHub 저장소 → **"Settings"**
2. 좌측 메뉴 **"Pages"**
3. Source: **"Deploy from a branch"**
4. Branch: **"main"** / **"/ (root)"**
5. **"Save"** 클릭

### 3단계: Firebase 도메인 추가

1. Firebase Console → **"Authentication"**
2. **"Settings"** → **"승인된 도메인"**
3. **"도메인 추가"**
4. `YOUR_USERNAME.github.io` 추가

---

## 👑 관리자 설정

### 최초 관리자 등록

1. 먼저 일반 사용자로 회원가입
2. 브라우저 개발자 도구 열기 (F12)
3. Console 탭에서 아래 명령 실행:

```javascript
// 현재 로그인한 사용자를 관리자로 설정
auth.onAuthStateChanged(user => {
    if (user) {
        setAsAdmin(user.uid).then(result => {
            console.log('관리자 설정 완료:', result);
            // 페이지 새로고침
            location.reload();
        });
    }
});
```

4. 페이지 새로고침 후 **"관리자"** 버튼 표시 확인

### Firestore에서 직접 설정 (대안)

1. Firebase Console → Firestore
2. `users` 컬렉션 → 해당 사용자 문서
3. `role` 필드 값을 `"admin"`으로 변경

---

## 📊 기능 설명

### 학습자 기능
- ✅ 이메일 또는 Google 로그인
- ✅ 30일 커리큘럼 학습
- ✅ 진행 상황 체크 (실시간 저장)
- ✅ 진행률 시각화

### 관리자 기능
- ✅ 전체 수강생 현황 대시보드
- ✅ 개별 수강생 진행률 확인
- ✅ 30일 레슨별 완료 현황 시각화
- ✅ 실시간 업데이트

---

## 💰 비용

Firebase 무료 티어 (Spark Plan) 한도:
- **Authentication**: 무제한 사용자
- **Firestore**: 1GB 저장, 50K 읽기/일, 20K 쓰기/일
- **Hosting**: 10GB 저장, 360MB/일 전송

**4명 수강생 사용 시**: 완전 무료 범위 내 ✅

---

## 🛠️ 문제 해결

### "Firebase is not defined" 오류
→ Firebase SDK 로드 순서 확인 (HTML 파일의 script 태그)

### Google 로그인 안됨
→ Firebase Console에서 Google 로그인 활성화 확인
→ 승인된 도메인에 현재 도메인 추가 확인

### 진행 상황이 저장 안됨
→ Firestore 보안 규칙 확인
→ 브라우저 콘솔에서 에러 메시지 확인

### 관리자 페이지 접근 불가
→ Firestore에서 해당 사용자의 role 필드가 "admin"인지 확인

---

## 📞 지원

문의사항이 있으시면 언제든 말씀해주세요!
