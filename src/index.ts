interface Env {
  TENANT_ID: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  SHAREPOINT_SITE_URL: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS 프리플라이트 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // 가입 양식 페이지 제공
    if (url.pathname === '/' && request.method === 'GET') {
      return getSignupPage();
    }

    // 가입 API 처리
    if (url.pathname === '/api/signup' && request.method === 'POST') {
      return handleSignup(request, env);
    }

    // 로그인 페이지 (선택사항)
    if (url.pathname === '/login' && request.method === 'GET') {
      return getLoginPage();
    }

    return new Response('Not Found', { status: 404 });
  }
};

function getSignupPage(): Response {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyWork - 회원가입</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }
        
        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .message {
            margin-top: 20px;
            padding: 12px;
            border-radius: 4px;
            text-align: center;
            font-size: 14px;
            display: none;
        }
        
        .message.error {
            background-color: #fee;
            color: #c00;
            display: block;
            border: 1px solid #fcc;
        }
        
        .message.success {
            background-color: #efe;
            color: #080;
            display: block;
            border: 1px solid #cfc;
        }
        
        .loading {
            display: none;
            text-align: center;
            color: #667eea;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>MyWork</h1>
        <p class="subtitle">회원가입</p>
        
        <form id="signupForm">
            <div class="form-row">
                <div class="form-group">
                    <label for="lastName">성 (Last Name)</label>
                    <input type="text" id="lastName" name="lastName" required>
                </div>
                <div class="form-group">
                    <label for="firstName">이름 (First Name)</label>
                    <input type="text" id="firstName" name="firstName" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="email">이메일 주소</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="phone">전화번호</label>
                <input type="tel" id="phone" name="phone" required>
            </div>
            
            <div class="form-group">
                <label for="company">회사명</label>
                <input type="text" id="company" name="company" required>
            </div>
            
            <button type="submit" id="submitBtn">가입하기</button>
            
            <div class="loading" id="loading">
                처리 중입니다...
            </div>
            
            <div class="message" id="message"></div>
        </form>
    </div>

    <script>
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const loadingEl = document.getElementById('loading');
            const messageEl = document.getElementById('message');
            
            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                company: document.getElementById('company').value.trim()
            };

            if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.company) {
                messageEl.className = 'message error';
                messageEl.textContent = '모든 필드를 입력해주세요.';
                return;
            }

            submitBtn.disabled = true;
            loadingEl.style.display = 'block';
            messageEl.className = 'message';

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    messageEl.className = 'message success';
                    messageEl.textContent = '가입 완료! 이메일을 확인하여 로그인해주세요.';
                    document.getElementById('signupForm').reset();
                } else {
                    messageEl.className = 'message error';
                    messageEl.textContent = '가입 실패: ' + (result.error || '알 수 없는 오류');
                }
            } catch (error) {
                messageEl.className = 'message error';
                messageEl.textContent = '오류 발생: ' + error.message;
            } finally {
                submitBtn.disabled = false;
                loadingEl.style.display = 'none';
            }
        });
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

function getLoginPage(): Response {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyWork - 로그인</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            text-align: center;
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; margin-bottom: 20px; }
        a { color: #667eea; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>MyWork</h1>
        <p>가입 이메일을 확인하여 Microsoft 365 계정으로 로그인해주세요.</p>
        <p>초대를 수락한 후 다시 방문해주시기 바랍니다.</p>
        <p><a href="/">← 돌아가기</a></p>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

async function handleSignup(request: Request, env: Env): Promise<Response> {
  try {
    const formData: SignupData = await request.json();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.company) {
      return jsonResponse({ error: '필수 필드가 누락되었습니다.' }, 400);
    }

    if (!isValidEmail(formData.email)) {
      return jsonResponse({ error: '유효한 이메일 주소를 입력해주세요.' }, 400);
    }

    const token = await getGraphToken(env);
    await inviteGuestUser(formData.email, formData.firstName, formData.lastName, token);
    await saveToSharePoint(formData, env, token);

    return jsonResponse({
      success: true,
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.'
    }, 200);
  } catch (error) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류 발생';
    return jsonResponse({ error: errorMessage }, 400);
  }
}

async function getGraphToken(env: Env): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`토큰 획득 실패: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

async function inviteGuestUser(
  email: string,
  firstName: string,
  lastName: string,
  token: string
): Promise<void> {
  const graphUrl = 'https://graph.microsoft.com/v1.0/invitations';

  const invitePayload = {
    invitedUserEmailAddress: email,
    inviteRedirectUrl: 'https://myworkwebhome.wjlee1860.workers.dev/login',
    sendInvitationMessage: true,
    invitedUserDisplayName: `${lastName} ${firstName}`,
    invitedUserMessageInfo: {
      messageLanguage: 'ko-KR',
      customizedMessageBody: `안녕하세요 ${firstName}님,\n\nMyWork 서비스에 가입하신 것을 환영합니다!\n\n아래 링크를 클릭하여 초대를 수락하고 Microsoft 365 계정으로 로그인해주세요.\n\n감사합니다.`
    }
  };

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invitePayload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`게스트 초대 실패: ${data.error?.message || JSON.stringify(data.error)}`);
  }
}

async function saveToSharePoint(formData: SignupData, env: Env, token: string): Promise<void> {
  const siteUrl = env.SHAREPOINT_SITE_URL;
  const listTitle = 'Registrations';

  const digestUrl = `${siteUrl}/_api/contextinfo`;

  const digestResponse = await fetch(digestUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!digestResponse.ok) {
    throw new Error('SharePoint 다이제스트 획득 실패');
  }

  const digestData = await digestResponse.json();
  const requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;

  const listUrl = `${siteUrl}/_api/web/lists/GetByTitle('${listTitle}')?$select=ListItemEntityTypeFullName`;

  const listResponse = await fetch(listUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!listResponse.ok) {
    throw new Error(`SharePoint 리스트 조회 실패: ${listResponse.statusText}`);
  }

  const listData = await listResponse.json();
  const entityTypeName = listData.d.ListItemEntityTypeFullName;

  const itemUrl = `${siteUrl}/_api/web/lists/GetByTitle('${listTitle}')/items`;

  const itemPayload = {
    '__metadata': { type: entityTypeName },
    'Title': `${formData.lastName} ${formData.firstName}`,
    'FirstName': formData.firstName,
    'LastName': formData.lastName,
    'Email': formData.email,
    'Phone': formData.phone,
    'Company': formData.company,
    'RegistrationDate': new Date().toISOString()
  };

  const itemResponse = await fetch(itemUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-RequestDigest': requestDigest,
      'Accept': 'application/json'
    },
    body: JSON.stringify(itemPayload)
  });

  if (!itemResponse.ok) {
    const errorText = await itemResponse.text();
    throw new Error(`SharePoint 아이템 생성 실패: ${itemResponse.statusText} - ${errorText}`);
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function jsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
