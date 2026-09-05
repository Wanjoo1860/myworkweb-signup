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
- **Cloudflare Workers** 계정 (무료 플랜 지원)
- **Microsoft 365** 구독 (Teams, SharePoint)
- **Azure AD** 애플리케이션 등록 권한

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

`.dev.vars.example` 참고하여 `.dev.vars` 생성:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` 파일에 실제 값 입력 (아래 "설정 및 구성" 참고):

```env
TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/yoursite
REDIRECT_URL=http://localhost:8787/login
SHAREPOINT_LIST_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SHAREPOINT_SITE_ID=yourcompany.sharepoint.com,xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
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

### Azure AD 애플리케이션 등록

#### 1. Azure Portal에서 앱 등록

1. [Azure Portal](https://portal.azure.com) 접속
2. **Azure Active Directory** → **앱 등록** → **새 등록**
3. **애플리케이션 이름**: `SignupApp` (또는 원하는 이름)
4. **지원되는 계정 유형**: `조직 디렉터리의 계정만 (단일 테넌트)`
5. **리다이렉트 URI** 추가:
   - 플랫폼: **웹**
   - URI: `https://yourdomain.workers.dev/callback`
   - 또는 로컬: `http://localhost:8787/callback`
6. **등록** 클릭

#### 2. 클라이언트 암호 생성

1. **인증서 및 암호** 섹션으로 이동
2. **새 클라이언트 암호** 클릭
3. **설명**: `Cloudflare Workers`
4. **만료**: `24개월` (선택사항)
5. **추가** 클릭
6. **값** 복사 후 안전한 곳에 저장 (⚠️ 이 값을 다시 볼 수 없음)

#### 3. 애플리케이션 ID와 테넌트 ID 복사

1. **개요** 섹션에서:
   - **애플리케이션(클라이언트) ID** 복사 → `CLIENT_ID`
   - **디렉터리(테넌트) ID** 복사 → `TENANT_ID`

#### 4. API 권한 설정

**⚠️ 중요**: Application Permission (Delegated ✗)으로 설정

1. **API 권한** 클릭
2. **+ 권한 추가** → **Microsoft Graph** → **애플리케이션 권한**
3. 다음 권한 검색 및 선택:
   - `Directory.ReadWrite.All`
   - `User.Invite.All` ← **매우 중요**
   - `User.Read.All`
   - `User.ReadWrite.All`
   - `Sites.ReadWrite.All`
4. **권한 추가** 클릭
5. **[조직]에 대한 관리자 동의 부여** 클릭 (관리자 권한 필요)
6. 모든 권한이 **초록색(✅ 허용됨)**인지 확인

### SharePoint 리스트 생성

#### 1. SharePoint 사이트 접속

```
https://yourcompany.sharepoint.com/sites/yoursite
```

#### 2. 새 리스트 생성

1. **+ 새로 만들기** → **목록**
2. **빈 목록** 선택
3. **리스트 이름**: `Registrations`
4. **만들기** 클릭

#### 3. 컬럼 추가

다음 컬럼을 추가합니다 (자동 생성된 "제목" 제외):

| 컬럼명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| FirstName | 한 줄 텍스트 | ✅ | 이름 |
| LastName | 한 줄 텍스트 | ✅ | 성 |
| Email | 한 줄 텍스트 | ✅ | 이메일 주소 |
| Phone | 한 줄 텍스트 | ❌ | 전화번호 |
| Company | 한 줄 텍스트 | ❌ | 회사명 |
| RegistrationDate | 날짜 | ❌ | 등록 날짜 |

#### 4. 리스트 ID와 사이트 ID 조회

Microsoft Graph Explorer 사용:
1. https://developer.microsoft.com/en-us/graph/graph-explorer 접속
2. 로그인 (Microsoft 계정)
3. 쿼리 실행:
   ```
   GET https://graph.microsoft.com/v1.0/sites/yourcompany.sharepoint.com:/sites/yoursite
   ```
4. 응답에서 `id` 값 복사 → `SHAREPOINT_SITE_ID`
5. 다시 쿼리:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists
   ```
6. Registrations 리스트의 `id` 값 복사 → `SHAREPOINT_LIST_ID`

### 외부 공유 설정

#### SharePoint 관리 센터

1. https://admin.microsoft.com 접속
2. **설정** → **조직 설정** → **공유**
3. **외부 공유**:
   - **새 게스트 및 기존 게스트** 선택
   - 또는 **기존 게스트** (더 제한적)
4. **저장**

#### Teams 관리 센터

1. https://admin.teams.microsoft.com 접속
2. **조직 전체 설정** → **게스트 액세스**
3. **게스트 액세스 허용**: `켜기`
4. 다음 기능 활성화:
   - ✅ 개인 통화 허용
   - ✅ 비디오 회의
   - ✅ 화면 공유
   - ✅ 채팅
5. **저장**

### 프로덕션 배포 설정

#### Cloudflare Workers 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. **Workers & Pages** → 프로젝트 선택
3. **Settings** → **Variables** → **Encrypt**

#### 환경 변수 등록 (프로덕션)

```bash
# 1. CLI로 secrets 등록
wrangler secret put TENANT_ID
# 입력: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

wrangler secret put CLIENT_ID
# 입력: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

wrangler secret put CLIENT_SECRET
# 입력: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 2. 확인
wrangler secret list
```

#### wrangler.toml 설정

프로젝트 루트의 `wrangler.toml`에 다음 내용 확인:

```toml
name = "myworkweb-signup"
main = "src/index.ts"
compatibility_date = "2024-09-23"
workers_dev = true

[build]
command = "npm install && npm run build"
cwd = "."

[vars]
SHAREPOINT_SITE_URL = "https://yourcompany.sharepoint.com/sites/yoursite"
REDIRECT_URL = "https://yourdomain.workers.dev/login"
TENANT_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
CLIENT_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
SHAREPOINT_LIST_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
SHAREPOINT_SITE_ID = "yourcompany.sharepoint.com,xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## 📁 프로젝트 구조

```
myworkweb-signup/
├── src/
│   └── index.ts                    # Worker 엔트리 포인트
├── dist/                           # 빌드 출력 (자동 생성)
├── package.json                    # 프로젝트 메타데이터
├── package-lock.json               # 의존성 잠금 파일
├── tsconfig.json                   # TypeScript 설정
├── wrangler.toml                   # Cloudflare Workers 설정
├── README.md                       # 프로젝트 문서
├── .gitignore                      # Git 무시 규칙
├── .dev.vars.example               # 환경 변수 예제 (공개)
└── PROJECT_GUIDE.md                # 개발 가이드 (선택사항)
```

---

## 🔄 작동 흐름

```
사용자 가입 폼 작성
     ↓
데이터 검증 (이메일, 필수 필드)
     ↓
Azure AD 토큰 요청 (Client Credentials Flow)
     ↓
Microsoft Graph API - Teams 게스트 초대 생성
     ↓
Microsoft Graph API - SharePoint 리스트에 데이터 저장
     ↓
사용자 이메일로 Microsoft 초대 발송
     ↓
사용자가 초대 링크 클릭
     ↓
Microsoft 계정으로 로그인
     ↓
Teams 및 SharePoint 접근 가능
```

---

## 📊 API 엔드포인트

### 회원가입 페이지

```
GET /
```

**응답**: HTML 회원가입 폼 UI

### 회원가입 API

```
POST /api/signup
Content-Type: application/json
```

**요청 본문**:

```json
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
  "invitationId": "00000000-0000-0000-0000-000000000000"
}
```

**오류 응답** (400/500):

```json
{
  "error": "오류 설명"
}
```

### 콜백 페이지

```
GET /callback
```

**응답**: 초대 수락 완료 메시지

### 로그인 안내 페이지

```
GET /login
```

**응답**: 로그인 방법 안내

---

## 🛠️ 개발 및 배포

### 로컬 개발

```bash
# 개발 서버 시작 (실시간 재로드)
npm run dev

# 다른 터미널: 로그 모니터링
wrangler tail --format pretty
```

### 빌드

```bash
# 프로덕션용 빌드
npm run build

# 빌드 결과물 확인
ls dist/
```

### 프로덕션 배포

```bash
# 배포 전 확인 사항
# 1. .dev.vars 파일이 .gitignore에 있는지 확인
# 2. wrangler.toml의 [vars] 섹션이 올바른지 확인
# 3. wrangler secret list로 secrets 확인

# 배포
npm run deploy

# 배포 상태 확인
wrangler deployments list

# 배포된 Worker 테스트
curl https://yourdomain.workers.dev/
```

---

## 🔒 보안 정보

### ⚠️ 필수 보안 주의사항

#### 1. 환경 변수 관리

```bash
# ❌ 절대 하지 말 것
# - CLIENT_SECRET을 코드에 직접 작성
# - .dev.vars 파일을 GitHub에 올리기
# - 실제 ID/토큰을 README에 포함

# ✅ 올바른 방법
# - .dev.vars를 .gitignore에 추가 (기본값)
# - 프로덕션 secrets는 wrangler CLI 또는 대시보드에서 관리
# - .dev.vars.example에는 예시만 작성
```

#### 2. API 권한 최소화

- **Application Permission** 사용 (Delegated ✗)
- `User.Invite.All`: 게스트 초대만 가능 (모든 사용자 수정 불가)
- `Sites.ReadWrite.All`: SharePoint 리스트만 수정 가능

#### 3. 네트워크 보안

```bash
# CORS 설정 확인
# 프로덕션: 신뢰할 수 있는 도메인만 허용
# 개발: localhost만 허용
```

#### 4. 감시 및 모니터링

```bash
# 정기적으로 로그 확인
wrangler tail --format pretty

# 오류 감지 시 즉시 secrets 재생성
wrangler secret delete CLIENT_SECRET
wrangler secret put CLIENT_SECRET
```

---

## 🐛 문제 해결

### 1. 토큰 오류 (`Token error: Unauthorized`)

**원인**:
- 잘못된 TENANT_ID, CLIENT_ID, CLIENT_SECRET
- Azure AD 앱이 삭제되었거나 비활성화됨

**해결**:
```bash
# 1. 자격증명 확인
wrangler secret list

# 2. Azure Portal에서 앱 등록 정보 재확인
# 3. 필요시 새 클라이언트 암호 생성
# 4. secrets 업데이트
wrangler secret put CLIENT_SECRET
```

### 2. 초대 오류 (`Invitation error: Unauthorized`)

**원인**:
- `User.Invite.All` 권한이 Delegated로 설정됨
- 관리자 동의가 완료되지 않음
- 권한 변경 후 캐시 미반영

**해결**:
```bash
# 1. Azure Portal → API 권한 확인
# 2. User.Invite.All이 "Application Permission"인지 확인
# 3. "만료된 동의" 또는 "불필요한 권한" 제거
# 4. [조직]에 대한 관리자 동의 부여 재실행
# 5. 30분 대기 후 테스트 (캐시 반영 대기)
```

### 3. SharePoint 저장 실패 (`List not found`)

**원인**:
- 리스트 이름이 정확하지 않음 (`Registrations` 아님)
- 잘못된 SHAREPOINT_SITE_ID 또는 SHAREPOINT_LIST_ID
- 리스트에 대한 권한 부족

**해결**:
```bash
# 1. Microsoft Graph Explorer에서 리스트 재확인
GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists

# 2. 리스트명이 정확히 "Registrations"인지 확인
# 3. 컬럼명이 정확한지 확인 (FirstName, LastName 등)
# 4. wrangler.toml에서 ID 값 업데이트
```

### 4. 이메일 미수신

**원인**:
- 스팸 폴더로 필터링
- 외부 공유 정책이 제한적으로 설정됨
- 초대 URL 유효 기간 만료

**해결**:
1. 수신자의 스팸 폴더 확인
2. SharePoint/Teams 게스트 정책 검토
3. 새 가입 시도

### 5. CORS 오류

**원인**:
- 브라우저 보안 정책 (크로스 도메인 요청)
- `REDIRECT_URL` 설정 오류

**해결**:
```bash
# 1. wrangler.toml의 REDIRECT_URL 확인
# 2. Azure AD 앱 등록의 리다이렉트 URI 확인
# 3. 두 값이 정확히 일치하는지 확인
# 4. 프로토콜(http/https) 확인
```

---

## 📈 성능 및 확장성

### 로드 테스트

```bash
# Apache Bench를 사용한 부하 테스트
ab -n 1000 -c 10 https://yourdomain.workers.dev/

# 결과: Cloudflare Workers는 자동 확장, 추가 설정 불필요
```

### 동시 가입 처리

- Cloudflare Workers는 자동 확장 (서버리스)
- 월 1,000,000개 요청 무료 (2024 기준)
- 제한 없음 (워낙 빠름)

---

## 🔄 CI/CD 배포 (선택사항)

### GitHub Actions 예제

프로젝트 루트에 `.github/workflows/deploy.yml` 생성:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## 📝 환경 변수 설명

| 변수명 | 설명 | 예시 | 보안 |
|--------|------|------|------|
| TENANT_ID | Azure AD 테넌트 ID | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | 공개 가능 |
| CLIENT_ID | Azure AD 애플리케이션 ID | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | 공개 가능 |
| CLIENT_SECRET | Azure AD 클라이언트 암호 | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | ⚠️ **비밀** |
| SHAREPOINT_SITE_URL | SharePoint 사이트 URL | https://company.sharepoint.com/sites/site | 공개 가능 |
| REDIRECT_URL | 초대 수락 후 리다이렉트 URL | https://yourdomain.workers.dev/login | 공개 가능 |
| SHAREPOINT_LIST_ID | SharePoint 리스트 ID | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | 공개 가능 |
| SHAREPOINT_SITE_ID | SharePoint 사이트 ID | company.sharepoint.com,xxx,xxx | 공개 가능 |

---

## 📚 참고 자료

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Microsoft Graph API 문서](https://docs.microsoft.com/graph/)
- [Azure AD 개발자 가이드](https://docs.microsoft.com/azure/active-directory/develop/)
- [SharePoint REST API 문서](https://docs.microsoft.com/sharepoint/dev/sp-add-ins/get-to-know-the-sharepoint-rest-service)
- [Teams 게스트 액세스](https://docs.microsoft.com/microsoftteams/guest-access)

---

## 💡 팁과 베스트 프랙티스

### 1. 로컬 개발 팁

```bash
# 실시간 로그 보기 (다른 터미널에서)
wrangler tail --format pretty

# 환경 변수 테스트
wrangler env list

# 특정 환경에서 실행
npx wrangler dev --env development
```

### 2. 배포 전 체크리스트

- [ ] .dev.vars가 .gitignore에 있는가?
- [ ] CLIENT_SECRET을 코드에 작성하지 않았는가?
- [ ] wrangler.toml의 vars 섹션이 올바른가?
- [ ] Azure AD의 리다이렉트 URI가 일치하는가?
- [ ] SharePoint 리스트의 컬럼명이 정확한가?
- [ ] Teams 게스트 정책이 활성화되었는가?

### 3. 모니터링

```bash
# 일일 확인 사항
wrangler tail --format pretty

# 주간 확인 사항
wrangler deployments list

# 월간 확인 사항
# - 비용 확인 (Cloudflare Dashboard)
# - 에러율 모니터링
# - 성능 분석
```

---

## 🤝 기여 방법

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능 ([LICENSE](LICENSE) 파일 참고)

---

## 🙏 감사의 말

- Cloudflare Workers 팀
- Microsoft Graph API 팀
- 모든 기여자들

---

## 변경 이력

| 버전 | 날짜 | 변경 사항 |
|------|------|---------|
| 1.0.0 | 2026-09-05 | 초기 릴리스 - Cloudflare Workers 배포, Teams 초대, SharePoint 통합 |

---

## 문제 발생 시

1. **로그 확인**: `wrangler tail --format pretty`
2. **오류 검색**: README의 "문제 해결" 섹션 참고
3. **GitHub Issues**: 문제를 상세히 기재하여 Issue 제출
4. **이메일 문의**: [프로젝트 관리자 이메일]

---

**마지막 업데이트**: 2026-09-05  
**상태**: ✅ 프로덕션 준비 완료
