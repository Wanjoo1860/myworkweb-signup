/// <reference types="@cloudflare/workers-types" />

export interface Env {
  TENANT_ID: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  SHAREPOINT_SITE_URL: string;
  REDIRECT_URL: string;
}

interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 🔴 DEBUG: env 확인
    console.log('=== FETCH START ===');
    console.log('env.TENANT_ID:', env.TENANT_ID);
    console.log('env.CLIENT_ID:', env.CLIENT_ID);
    console.log('env.CLIENT_SECRET:', env.CLIENT_SECRET ? '***set***' : 'UNDEFINED');
    console.log('pathname:', url.pathname);

    // CORS 프리플라이트 처리
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // 라우팅
    if (url.pathname === '/' && request.method === 'GET') {
      return getSignupPage();
    }

    if (url.pathname === '/api/signup' && request.method === 'POST') {
      return handleSignup(request, env);
    }

    // 리디렉션 URL (Azure AD에 등록한 URL과 일치해야 함)
    if (url.pathname === '/callback' && request.method === 'GET') {
      return getCallbackPage();
    }

    if (url.pathname === '/login' && request.method === 'GET') {
      return getLoginPage();
    }

    return new Response('404 Not Found', { status: 404 });
  }
};

// ============ HTML 페이지 ============

function getSignupPage(): Response {
  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Teams 회원가입</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #0078d4;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          color: #333;
          font-weight: 500;
          margin-bottom: 8px;
          font-size: 14px;
        }
        input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #0078d4;
          box-shadow: 0 0 0 3px rgba(0,120,212,0.1);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        button {
          width: 100%;
          padding: 12px;
          background: #0078d4;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
          margin-top: 10px;
        }
        button:hover {
          background: #005a9e;
        }
        button:active {
          transform: scale(0.98);
        }
        .message {
          margin-top: 20px;
          padding: 15px;
          border-radius: 6px;
          font-size: 14px;
          display: none;
        }
        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          display: block;
        }
        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          display: block;
        }
        .loading {
          display: none;
          text-align: center;
          color: #0078d4;
          font-size: 14px;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✉️ Teams 회원가입</h1>
          <p>정보를 입력하면 Teams 게스트로 자동 등록됩니다</p>
        </div>

        <form id="signupForm">
          <div class="form-row">
            <div class="form-group">
              <label for="lastName">성 (Last Name) *</label>
              <input type="text" id="lastName" name="lastName" required>
            </div>
            <div class="form-group">
              <label for="firstName">이름 (First Name) *</label>
              <input type="text" id="firstName" name="firstName" required>
            </div>
          </div>

          <div class="form-group">
            <label for="email">이메일 *</label>
            <input type="email" id="email" name="email" required>
          </div>

          <div class="form-group">
            <label for="phone">전화</label>
            <input type="tel" id="phone" name="phone">
          </div>

          <div class="form-group">
            <label for="company">회사</label>
            <input type="text" id="company" name="company">
          </div>

          <button type="submit" id="submitBtn">가입하기</button>
          <div class="loading" id="loading">처리 중...</div>
        </form>

        <div id="message" class="message"></div>
      </div>

      <script>
        const form = document.getElementById('signupForm');
        const submitBtn = document.getElementById('submitBtn');
        const loading = document.getElementById('loading');
        const messageDiv = document.getElementById('message');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // UI 업데이트
          submitBtn.disabled = true;
          loading.style.display = 'block';
          messageDiv.className = 'message';
          messageDiv.textContent = '';

          const formData = {
            lastName: document.getElementById('lastName').value.trim(),
            firstName: document.getElementById('firstName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim() || undefined,
            company: document.getElementById('company').value.trim() || undefined
          };

          try {
            const response = await fetch('/api/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
            });

            const result = (await response.json()) as { id?: string };

            if (response.ok) {
              messageDiv.className = 'message success';
              messageDiv.textContent = '✅ 가입 완료! 이메일을 확인하세요.';
              form.reset();
            } else {
              messageDiv.className = 'message error';
              messageDiv.textContent = '❌ 오류: ' + (result.error || '알 수 없는 오류');
            }
          } catch (err) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '❌ 요청 실패: ' + (err instanceof Error ? err.message : '알 수 없음');
          } finally {
            submitBtn.disabled = false;
            loading.style.display = 'none';
          }
        });
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// Azure AD 콜백 페이지 (Microsoft 초대 수락 후 리디렉션되는 페이지)
function getCallbackPage(): Response {
  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>초대 수락 완료</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        h1 {
          color: #0078d4;
          font-size: 28px;
          margin-bottom: 20px;
        }
        p {
          color: #666;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 15px;
        }
        .success-box {
          background: #d4edda;
          border: 2px solid #28a745;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          color: #155724;
        }
        a {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 30px;
          background: #0078d4;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.3s;
        }
        a:hover {
          background: #005a9e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ 초대를 수락했습니다!</h1>
        
        <div class="success-box">
          <p><strong>축하합니다!</strong></p>
          <p>Teams 게스트 계정이 활성화되었습니다.</p>
        </div>

        <p>이제 다음 서비스에 접근할 수 있습니다:</p>
        
        <div style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <ul style="list-style: none;">
            <li>✓ Microsoft Teams</li>
            <li>✓ SharePoint</li>
            <li>✓ 협업 문서</li>
            <li>✓ 팀 채팅</li>
          </ul>
        </div>

        <a href="https://teams.microsoft.com" target="_blank">Teams에서 시작하기</a>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function getLoginPage(): Response {
  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>로그인 - Teams</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        h1 {
          color: #0078d4;
          font-size: 28px;
          margin-bottom: 20px;
        }
        p {
          color: #666;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 15px;
        }
        .highlight {
          background: #fff3cd;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #ffc107;
          margin: 20px 0;
          text-align: left;
          color: #856404;
        }
        a {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 30px;
          background: #0078d4;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.3s;
        }
        a:hover {
          background: #005a9e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 회원가입이 완료되었습니다!</h1>
        
        <p>이메일을 확인하세요.</p>
        
        <div class="highlight">
          <strong>📧 다음 단계:</strong>
          <ol style="margin-top: 10px; margin-left: 20px;">
            <li>이메일 받은편지함을 확인하세요</li>
            <li>Microsoft 초대 링크를 클릭하세요</li>
            <li>Microsoft 계정으로 로그인하세요</li>
            <li>Teams와 SharePoint에 접근하실 수 있습니다</li>
          </ol>
        </div>

        <p>초대 링크가 없으신가요? 스팸 폴더를 확인해주세요.</p>

        <a href="https://teams.microsoft.com" target="_blank">Teams 열기</a>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ============ API 핸들러 ============

async function handleSignup(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as SignupRequest;

    // 🔴 DEBUG: env 확인
    console.log('=== SIGNUP REQUEST ===');
    console.log('env.TENANT_ID:', env.TENANT_ID);
    console.log('env.CLIENT_ID:', env.CLIENT_ID);
    console.log('env.CLIENT_SECRET:', env.CLIENT_SECRET ? '***set***' : 'UNDEFINED');

    // 검증
    if (!body.email || !isValidEmail(body.email)) {
      return jsonResponse({ error: '유효한 이메일을 입력하세요.' }, 400);
    }

    if (!body.firstName || !body.lastName) {
      return jsonResponse({ error: '성과 이름은 필수입니다.' }, 400);
    }

    console.log('Signup request:', { email: body.email, firstName: body.firstName, lastName: body.lastName });

    // Secrets 필수 검증
    if (!env.TENANT_ID || !env.CLIENT_ID || !env.CLIENT_SECRET) {
      console.error('Missing required secrets!', { 
        TENANT_ID: !!env.TENANT_ID, 
        CLIENT_ID: !!env.CLIENT_ID, 
        CLIENT_SECRET: !!env.CLIENT_SECRET 
      });
      return jsonResponse({ error: '서버 구성 오류: 필수 자격증명이 설정되지 않았습니다.' }, 500);
    }

    // 1. Graph API 토큰 획득
    const token = await getGraphToken(env.TENANT_ID, env.CLIENT_ID, env.CLIENT_SECRET);

    // 2. Teams 게스트 초대
    const invitationResult = await inviteGuestUser(body.email, env.REDIRECT_URL, token);

    if (!invitationResult || !invitationResult.id) {
      throw new Error('초대 생성 실패');
    }

    console.log('Invitation created:', invitationResult.id);

    // 3. SharePoint List에 저장
    await saveToSharePoint(body, env.SHAREPOINT_SITE_URL, token);

    console.log('Data saved to SharePoint');

    return jsonResponse(
      {
        success: true,
        message: '가입 완료! 이메일을 확인하세요.',
        invitationId: invitationResult.id
      },
      200
    );
  } catch (error: any) {
    console.error('Signup error:', error.message || error);
    return jsonResponse({ error: error.message || '가입 중 오류 발생' }, 500);
  }
}

// ============ Microsoft Graph API ============

async function getGraphToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
  // 🔴 DEBUG
  console.log('=== GET GRAPH TOKEN ===');
  console.log('tenantId:', tenantId);
  console.log('clientId:', clientId);
  console.log('clientSecret:', clientSecret ? '***set***' : 'UNDEFINED');

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(`Missing credentials: tenantId=${tenantId}, clientId=${clientId}, clientSecret=${clientSecret ? 'set' : 'undefined'}`);
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  console.log('Token URL:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    }).toString()
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token request failed:', response.status, error);
    throw new Error(`Token error: ${response.statusText} - ${error}`);
  }

  const data = (await response.json()) as any;
  console.log('Token acquired successfully');
  return data.access_token;
}

async function inviteGuestUser(email: string, redirectUrl: string, token: string): Promise<any> {
  console.log('=== INVITE GUEST USER ===');
  console.log('email:', email);
  console.log('redirectUrl:', redirectUrl);

  const response = await fetch('https://graph.microsoft.com/v1.0/invitations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      invitedUserEmailAddress: email,
      inviteRedirectUrl: redirectUrl,
      sendInvitationMessage: true,
      invitedUserMessageInfo: {
        messageLanguage: 'ko-KR',
        customizedMessageBody: `안녕하세요!\n\nTeams 협업 플랫폼에 초대되었습니다.\n초대 링크를 클릭하여 로그인하세요.`
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Invitation request failed:', response.status, error);
    throw new Error(`Invitation error: ${response.statusText} - ${error}`);
  }

  const result = await response.json();
  console.log('Invitation created:', result.id);
  return result;
}

// ============ SharePoint API ============

async function saveToSharePoint(data: SignupRequest, sharePointSiteUrl: string, token: string): Promise<void> {
  try {
    console.log('=== SAVE TO SHAREPOINT ===');
    console.log('sharePointSiteUrl:', sharePointSiteUrl);

    // Step 1: 리스트 메타데이터 조회
    const listUrl = `${sharePointSiteUrl}/_api/web/lists/GetByTitle('Registrations')`;
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (!listResponse.ok) {
      throw new Error(`List not found: ${listResponse.statusText}`);
    }

    const listData = (await listResponse.json()) as any;
    const listItemEntityTypeFullName = listData.ListItemEntityTypeFullName;

    // Step 2: CSRF 토큰(Digest) 획득
    const contextUrl = `${sharePointSiteUrl}/_api/contextinfo`;
    const contextResponse = await fetch(contextUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Length': '0'
      }
    });

    if (!contextResponse.ok) {
      throw new Error(`Context error: ${contextResponse.statusText}`);
    }

    const contextData = (await contextResponse.json()) as any;
    const digest = contextData.FormDigestValue;

    // Step 3: 아이템 생성
    const itemUrl = `${sharePointSiteUrl}/_api/web/lists/GetByTitle('Registrations')/items`;
    const itemResponse = await fetch(itemUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-RequestDigest': digest,
        Accept: 'application/json'
      },
      body: JSON.stringify({
        __metadata: { type: listItemEntityTypeFullName },
        Title: `${data.firstName} ${data.lastName}`,
        FirstName: data.firstName,
        LastName: data.lastName,
        Email: data.email,
        Phone: data.phone || '',
        Company: data.company || '',
        RegistrationDate: new Date().toISOString()
      })
    });

    if (!itemResponse.ok) {
      const error = await itemResponse.text();
      console.error('Item creation failed:', itemResponse.status, error);
      throw new Error(`Item creation failed: ${itemResponse.statusText} - ${error}`);
    }

    console.log('Item created successfully');
  } catch (error: any) {
    console.error('SharePoint save error:', error.message || error);
    throw error;
  }
}

// ============ 유틸리티 ============

function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
