# MyWorkWeb Signup - Teams 회원가입 시스템

Microsoft Teams와 SharePoint를 활용한 자동 게스트 회원가입 시스템입니다. Cloudflare Workers 서버리스 플랫폼에서 실행되며, 사용자가 가입 폼을 작성하면 자동으로 Teams 게스트 계정이 생성되고 SharePoint 리스트에 저장됩니다.

## 🎯 주요 기능

- **자동 회원가입** - 로그인 없이 누구나 가입 가능
- **Teams 게스트 등록** - Microsoft Graph API를 통한 자동 초대
- **SharePoint 데이터 저장** - 가입 정보 자동 저장
- **이메일 초대** - Microsoft 초대 이메일 자동 발송
- **반응형 UI** - 모바일/태블릿 완벽 지원
- **환경별 설정** - 개발/프로덕션 환경 분리

---

## 📋 시스템 요구사항

- **Node.js** 18.0 이상
- **npm** 9.0 이상
- **Cloudflare Workers** 계정
- **Microsoft 365** 구독 (Teams, SharePoint)
- **Azure AD** 애플리케이션 등록

---

## 🚀 빠른 시작

### 1단계: 프로젝트 클론

```bash
git clone https://github.com/YOUR_USERNAME/myworkweb-signup.git
cd myworkweb-signup
```

### 2단계: 의존성 설치

```bash
npm install
```

### 3단계: 환경 변수 설정

`.dev.vars.example`을 `.dev.vars`로 복사:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` 파일에 실제 값 입력:

```env 아래는 예제로 실제 값을 넣어야 함
TENANT_ID=77ad8ab8-7d87-1111-a442-8d26f9c8abcd
CLIENT_ID=dcab512e-de4e-1111-a23d-36c1149babcd
CLIENT_SECRET=ea17eacf-5194-1111-b716-1e9249acabcd
```

### 4단계: 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:8787` 접속

### 5단계: 프로덕션 배포

```bash
npm run deploy
```

---

## ⚙️ 설정 및 구성

### Azure AD 앱 등록

1. [Azure Portal](https://portal.azure.com) 접속
2. **Azure Active Directory** → **앱 등록** → **새 등록**
3. 앱 이름: `CloudflareSignupApp`
4. **지원되는 계정 유형**: 조직 디렉터리의 계정만
5. **리다이렉트 URI** 추가:
   - 플랫폼: **웹**
   - URI: `https://myworkweb-signup.wjlee1860.workers.dev/callback`
6. **인증서 및 암호** → **새 클라이언트 암호** 생성
   - 설명: `Cloudflare Workers Secret`
   - 저장 및 복사
7. **API 권한** 추가:
   - `User.Invite.All` (Microsoft Graph)
   - `User.Read.All` (Microsoft Graph)
   - `Sites.ReadWrite.All` (Microsoft Graph)
8. **승인** 클릭

### SharePoint 리스트 생성

1. SharePoint 사이트 접속: 
   ```
   https://myworkweb.sharepoint.com/sites/myworkhome
   ```

2. **+ 새로 만들기** → **목록** → **빈 목록**

3. 목록 이름: `Registrations`

4. 다음 열 추가:
   - `FirstName` (한 줄 텍스트, 필수)
   - `LastName` (한 줄 텍스트, 필수)
   - `Email` (한 줄 텍스트, 필수)
   - `Phone` (한 줄 텍스트)
   - `Company` (한 줄 텍스트)
   - `RegistrationDate` (날짜/시간)

### 외부 공유 설정

#### SharePoint 관리 센터

1. https://admin.microsoft.com 접속
2. **설정** → **조직 설정** → **공유**
3. **외부 공유**: `새 게스트 및 기존 게스트` 선택
4. 게스트 만료 시간: `180일` (선택사항)
5. **저장**

#### Teams 관리 센터

1. https://admin.teams.microsoft.com 접속
2. **조직 전체 설정** → **게스트 액세스**
3. **게스트 액세스 허용**: `켜기`
4. 다음 기능 활성화:
   - 개인 통화 허용: ✅
   - 비디오 회의: ✅
   - 화면 공유: ✅
   - 채팅: ✅
5. **저장**

### 프로덕션 배포 설정

```bash
# 프로덕션 환경 secrets 등록
wrangler secret put TENANT_ID --env production
# → 77ad8ab8-7d87-1111-a442-8d26f9c8abcd 입력

wrangler secret put CLIENT_ID --env production
# → dcab512e-de4e-1111-a23d-36c1149babcd 입력

wrangler secret put CLIENT_SECRET --env production
# → ea17eacf-5194-1111-b716-1e9249acabcd 입력

# 배포
wrangler deploy --env production
```

---

## 📁 프로젝트 구조

```
myworkweb-signup/
├── src/
│   └── index.ts                    # Worker 엔트리 포인트
├── package.json                    # 프로젝트 메타데이터
├── package-lock.json               # 의존성 잠금 파일
├── tsconfig.json                   # TypeScript 설정
├── wrangler.toml                   # Cloudflare Workers 설정
├── README.md                       # 이 파일
├── .gitignore                      # Git 무시 규칙
└── .dev.vars.example               # 환경 변수 예제
```

---

## 🔄 작동 흐름

1. **사용자 가입** - 로그인 없이 회원가입 폼 작성
2. **데이터 검증** - 이메일 형식 및 필수 필드 확인
3. **Teams 초대 생성** - Microsoft Graph API로 게스트 초대
4. **SharePoint 저장** - 가입 정보 리스트에 저장
5. **이메일 발송** - Microsoft 초대 이메일 자동 발송
6. **사용자 수락** - 사용자가 초대 링크 클릭
7. **콜백** - `/callback` 페이지로 리디렉션
8. **Teams 접근** - 게스트 계정으로 Teams/SharePoint 접근 가능

---

## 🔒 보안 정보

### 기밀 정보 관리

- `.dev.vars` 파일은 **절대 GitHub에 올리지 마세요**
- `.gitignore`에 자동으로 포함됩니다
- 프로덕션 secrets는 `wrangler secret put` 명령으로 관리됩니다

### API 권한

- 최소 권한 원칙 적용
- `User.Invite.All`: 게스트 초대만 가능
- `Sites.ReadWrite.All`: SharePoint 리스트만 수정 가능

---

## 🛠️ 개발 및 배포

### 로컬 개발

```bash
# 개발 서버 실행 (실시간 재로드)
npm run dev

# 빌드 테스트
npm run build

# 빌드 결과물 확인
ls dist/
```

### 프로덕션 배포

```bash
# Secrets 등록 (처음 한 번만)
wrangler secret put TENANT_ID --env production
wrangler secret put CLIENT_ID --env production
wrangler secret put CLIENT_SECRET --env production
wrangler secret put SHAREPOINT_SITE_URL --env production

# 배포
npm run deploy

# 배포 상태 확인
wrangler deployments list
```

### 배포된 Worker 테스트

```bash
# 프로덕션 URL 접속
curl https://myworkweb-signup.wjlee1860.workers.dev/

# 회원가입 API 테스트
curl -X POST https://myworkweb-signup.wjlee1860.workers.dev/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "테스트",
    "lastName": "사용자",
    "email": "test@example.com",
    "company": "테스트 회사"
  }'
```

---

## 📊 API 엔드포인트

### 회원가입 페이지

```
GET https://myworkweb-signup.wjlee1860.workers.dev/
```

응답: HTML 회원가입 폼

### 회원가입 API

```
POST https://myworkweb-signup.wjlee1860.workers.dev/api/signup
Content-Type: application/json

{
  "firstName": "string (필수)",
  "lastName": "string (필수)",
  "email": "string (필수, 이메일 형식)",
  "phone": "string (선택)",
  "company": "string (선택)"
}
```

**성공 응답** (200):
```json
{
  "success": true,
  "message": "가입 완료! 이메일을 확인하세요.",
  "invitationId": "string"
}
```

**오류 응답** (400/500):
```json
{
  "error": "오류 메시지"
}
```

### 콜백 페이지

```
GET https://myworkweb-signup.wjlee1860.workers.dev/callback
```

응답: 초대 수락 완료 메시지 + Teams 링크

### 로그인 안내 페이지

```
GET https://myworkweb-signup.wjlee1860.workers.dev/login
```

응답: 로그인 방법 안내

---

## 🐛 문제 해결

### 토큰 오류 (`Token error`)

**증상**: Graph API 호출 실패
**원인**: Azure AD 자격증명 오류
**해결**:
- TENANT_ID, CLIENT_ID, CLIENT_SECRET 확인
- Azure Portal에서 앱 등록 정보 재확인
- API 권한 재설정

### 리스트 찾기 실패 (`List not found`)

**증상**: SharePoint에 데이터 저장 실패
**원인**: 리스트 이름 또는 사이트 URL 오류
**해결**:
- SharePoint 사이트 URL 확인
- 리스트 이름이 정확히 `Registrations`인지 확인
- 리스트 권한 확인 (공유 설정)

### 초대 이메일 미수신

**증상**: 사용자가 초대 이메일을 받지 못함
**원인**: 
- 스팸 폴더 필터링
- 외부 공유 설정 미활성화
- 초대 URL 유효 기간 만료
**해결**:
- 스팸 폴더 확인
- SharePoint/Teams 게스트 정책 재확인
- 새로 가입 시도

### CORS 오류

**증상**: 브라우저 콘솔에 CORS 오류
**원인**: 도메인 불일치
**해결**:
- wrangler.toml의 REDIRECT_URL 확인
- Azure AD 리다이렉트 URI 확인
- 도메인 일치 여부 확인

---

## 📞 지원 및 연락

문제가 발생하면:

1. **로그 확인**: Cloudflare Dashboard → Workers → 실시간 로그
2. **오류 메시지**: 콘솔에 출력된 오류 메시지 확인
3. **Issue 제출**: GitHub Issues에 문제 내용 기재

---

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 🙏 감사의 말

- Cloudflare Workers 문서
- Microsoft Graph API 문서
- SharePoint REST API 문서

---

## 변경 이력

| 버전 | 날짜 | 변경 사항 |
|------|------|---------|
| 1.0.0 | 2026-09-05 | 초기 릴리스 |

---

**마지막 업데이트**: 2026-09-05
