/* 띵타이쿤 WIKI · 공통 계정 창 (Supabase 이메일 인증)
 * 공개 키만 사용합니다. 권한은 서버의 RLS / 관리자 RPC가 검사해야 합니다.
 */
(() => {
  'use strict';
  const button = document.getElementById('headerLogin');
  if (!button) return;
  const settings = window.DDING_SUPABASE_CONFIG || {};
  let projectUrl = '', configurationError = '';
  try {
    const raw = String(settings.url || '').trim();
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) throw new Error('URL 형식이 맞지 않습니다.');
    // Supabase JavaScript SDK requires the project origin, not the PostgREST endpoint.
    projectUrl = parsed.origin;
  } catch (_) { configurationError = 'Supabase 프로젝트 URL을 확인해 주세요.'; }
  const publishableKey = String(settings.publishableKey || '').trim();
  if (!publishableKey || (!publishableKey.startsWith('sb_publishable_') && !publishableKey.startsWith('eyJ'))) {
    configurationError = 'Supabase Publishable Key를 확인해 주세요.';
  }
  let client = null, currentUser = null, isOpen = false, activeTab = 'login', busy = false;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = document.createElement('div');
  root.id = 'siteAuthDialog';
  root.className = 'site-auth-backdrop';
  root.hidden = true;
  root.innerHTML = `<section class="site-auth-window" role="dialog" aria-modal="true" aria-labelledby="authHeading" tabindex="-1">
    <button type="button" class="site-auth-close" aria-label="닫기" data-auth-action="close">×</button>
    <div class="site-auth-logo">✦</div>
    <h2 id="authHeading">계정</h2>
    <p id="authDescription" class="site-auth-description"></p>
    <div id="authTabs" class="site-auth-tabs" role="tablist" aria-label="계정 기능"></div>
    <div id="authContents"></div>
    <p id="authFeedback" class="site-auth-feedback" role="status" aria-live="polite" hidden></p>
  </section>`;
  document.body.append(root);
  const $ = sel => root.querySelector(sel);
  const area = $('#authContents'), tabs = $('#authTabs'), feedback = $('#authFeedback');
  let lastFocus = null;
  function announce(message, kind='info') {
    feedback.textContent = message;
    feedback.dataset.kind = kind;
    feedback.hidden = !message;
  }
  function updateHeader() {
    if (currentUser) {
      button.textContent = '내 계정';
      button.title = currentUser.email || '로그인됨';
      button.setAttribute('aria-label','내 계정 관리');
    } else {
      button.textContent = '로그인 / 회원가입';
      button.removeAttribute('title');
      button.setAttribute('aria-label','로그인 또는 회원가입');
    }
  }
  function notifyFrames() {
    for (const id of ['expertsFrame','pricesFrame']) {
      const frame = document.getElementById(id);
      if (!frame?.contentWindow) continue;
      try { frame.contentWindow.postMessage({type:'dding-auth-updated'}, location.origin); } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent('dding-auth-state-changed',{detail:{signedIn:!!currentUser}}));
  }
  function formUi() {
    if (currentUser) {
      tabs.innerHTML = '';
      $('#authHeading').textContent = '내 계정';
      $('#authDescription').textContent = '로그인된 계정에서 전문가 스킬 기록과 관리자 기능을 사용할 수 있습니다.';
      area.innerHTML = `<div class="site-auth-profile"><span>이메일</span><strong>${esc(currentUser.email || '계정')}</strong></div>
        <button type="button" class="site-auth-button site-auth-button-muted" data-auth-action="logout">로그아웃</button>`;
      return;
    }
    const names = [['login','로그인'],['register','회원가입'],['reset','비밀번호 찾기']];
    tabs.innerHTML = names.map(([mode,label])=>`<button type="button" role="tab" data-auth-tab="${mode}" aria-selected="${String(mode===activeTab)}" class="${mode===activeTab?'active':''}">${label}</button>`).join('');
    $('#authHeading').textContent = activeTab === 'login' ? '로그인' : activeTab === 'register' ? '회원가입' : '비밀번호 찾기';
    $('#authDescription').textContent = activeTab === 'login' ? '이메일로 로그인하면 전문가 스킬 레벨이 계정에 저장됩니다.' : activeTab === 'register' ? '이메일과 비밀번호로 계정을 만들 수 있습니다.' : '가입한 이메일로 비밀번호 변경 링크를 요청합니다.';
    const password = activeTab !== 'reset';
    area.innerHTML = `<form id="authAccountForm" class="site-auth-form">
        <label for="authEmail">이메일</label><input id="authEmail" type="email" name="email" placeholder="name@example.com" autocomplete="email" required maxlength="254">
        ${password ? `<label for="authPassword">비밀번호</label><div class="site-auth-password-field"><input id="authPassword" type="password" name="password" minlength="6" autocomplete="${activeTab==='register'?'new-password':'current-password'}" placeholder="6자 이상" required><button type="button" data-auth-reveal="authPassword" aria-label="비밀번호 표시" aria-pressed="false">보기</button></div>` : ''}
        ${activeTab==='register'?`<label for="authConfirm">비밀번호 확인</label><div class="site-auth-password-field"><input id="authConfirm" type="password" name="confirmation" autocomplete="new-password" minlength="6" placeholder="비밀번호 다시 입력" required><button type="button" data-auth-reveal="authConfirm" aria-label="비밀번호 확인 표시" aria-pressed="false">보기</button></div>`:''}
        <button type="submit" class="site-auth-button">${activeTab==='login'?'로그인':activeTab==='register'?'회원가입':'재설정 메일 보내기'}</button>
      </form>`;
  }
  function draw() {
    formUi();
    updateHeader();
    if (configurationError) announce(configurationError + ' 관리자에게 연결 설정을 확인해 달라고 요청해 주세요.', 'error');
    else if (!client) announce('로그인 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.', 'error');
    else announce('');
  }
  function open(mode='login') {
    if (busy) return;
    lastFocus = document.activeElement;
    activeTab = ['login','register','reset'].includes(mode)?mode:'login';
    isOpen = true;
    root.hidden = false;
    document.body.classList.add('site-auth-open');
    draw();
    requestAnimationFrame(()=> ($('#authEmail') || $('[data-auth-action="logout"]') || $('.site-auth-close'))?.focus());
  }
  function close() {
    if (busy) return;
    isOpen = false;
    root.hidden = true;
    document.body.classList.remove('site-auth-open');
    if (lastFocus?.isConnected) lastFocus.focus();
  }
  function setBusy(v) {
    busy = v;
    area.querySelectorAll('input,button').forEach(el=>el.disabled=v);
    tabs.querySelectorAll('button').forEach(el=>el.disabled=v);
  }
  async function submitForm(e) {
    e.preventDefault();
    if (busy) return;
    if (configurationError || !client) { announce(configurationError || '인증 서버에 연결할 수 없습니다.', 'error'); return; }
    const email = $('#authEmail')?.value?.trim() || '';
    const password = $('#authPassword')?.value || '';
    if (!email || !email.includes('@')) {announce('이메일 주소를 확인해 주세요.','error');return;}
    if (activeTab==='register' && password !== $('#authConfirm')?.value) {announce('비밀번호 확인이 일치하지 않습니다.','error');return;}
    setBusy(true);
    announce('처리 중입니다.');
    try {
      const redirect = new URL('./', document.baseURI).href.split('#')[0];
      if (activeTab==='register') {
        const {data,error} = await client.auth.signUp({email,password,options:{emailRedirectTo:redirect}});
        if (error) throw error;
        if (data?.session) {
          announce('회원가입과 로그인이 완료되었습니다.','success');
          setTimeout(()=>{if(!busy)close();},250);
        } else {
          announce('회원가입 요청이 접수되었습니다. 인증 메일이 도착하면 링크를 눌러 주세요. 메일이 없으면 스팸함과 Supabase 이메일 발송 설정을 확인해 주세요.','success');
          // If Supabase confirms signups by email, do not falsely claim this account is logged in.
        }
      } else if (activeTab==='reset') {
        const {error} = await client.auth.resetPasswordForEmail(email,{redirectTo:redirect});
        if (error) throw error;
        announce('비밀번호 재설정 메일을 요청했습니다. 메일함을 확인해 주세요.','success');
      } else {
        const {error} = await client.auth.signInWithPassword({email,password});
        if (error) throw error;
        announce('로그인 성공','success');
        setTimeout(()=>{if(!busy)close();},250);
      }
    } catch(err) {
      const raw = String(err?.message || err);
      let message = raw;
      if (/invalid login credentials/i.test(raw)) message = '이메일이나 비밀번호가 맞지 않습니다. 회원가입과 이메일 인증 여부를 확인해 주세요.';
      else if (/email not confirmed/i.test(raw)) message = '이메일 인증을 먼저 완료해 주세요.';
      else if (/email address not authorized/i.test(raw)) message = 'Supabase 이메일 발송 정책으로 인증 메일을 보낼 수 없습니다. SMTP 설정이 필요할 수 있습니다.';
      announce(message,'error');
    } finally { setBusy(false); }
  }
  root.addEventListener('submit', e=>{if(e.target.id==='authAccountForm')void submitForm(e);});
  root.addEventListener('click', e=>{
    if (e.target===root) {return;} // Close only via the X button; preserve form when clicking the backdrop.
    const reveal=e.target.closest('[data-auth-reveal]');
    if(reveal){
      const input=$('#'+reveal.dataset.authReveal);
      if(!input)return;
      const visible=input.type==='password';
      input.type=visible?'text':'password';
      reveal.textContent=visible?'숨기기':'보기';
      reveal.setAttribute('aria-pressed',String(visible));
      reveal.setAttribute('aria-label',visible?'비밀번호 숨기기':'비밀번호 표시');
      input.focus({preventScroll:true});
      return;
    }
    const tab=e.target.closest('[data-auth-tab]');
    if (tab && !busy) {activeTab=tab.dataset.authTab;draw();$('#authEmail')?.focus();return;}
    const action=e.target.closest('[data-auth-action]')?.dataset.authAction;
    if (action==='close') close();
    if (action==='logout' && !busy && client) {
      setBusy(true);announce('로그아웃 중입니다.');
      void client.auth.signOut().then(({error})=>{
        if(error)throw error;
        currentUser=null;updateHeader();notifyFrames();
        setBusy(false);
        close();
      }).catch(err=>announce(`로그아웃 오류: ${err.message}`,'error')).finally(()=>setBusy(false));
    }
  });
  document.addEventListener('keydown', e=>{
    if (!isOpen) return;
    if(e.key==='Escape') {e.preventDefault();close();return;}
    if(e.key==='Tab') {
      const nodes=[...root.querySelectorAll('button:not([disabled]), input:not([disabled])')].filter(el=>el.getClientRects().length);
      if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  button.addEventListener('click',()=>open());
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin || !e.data || e.data.type!=='dding-auth-open')return;
    if(!['expertsFrame','pricesFrame'].some(id=>document.getElementById(id)?.contentWindow===e.source))return;
    open(e.data.mode||'login');
  });
  window.DDING_SITE_AUTH={open,close,get user(){return currentUser},get client(){return client}};
  if (!configurationError && window.supabase?.createClient) {
    try {
      client=window.supabase.createClient(projectUrl,publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      client.auth.onAuthStateChange((event,session)=>{
        currentUser=session?.user||null;
        updateHeader();notifyFrames();
        if(isOpen && (event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='INITIAL_SESSION')) {
          const value=$('#authEmail')?.value||'';
          draw();
          if (!currentUser && $('#authEmail')) $('#authEmail').value=value;
        }
      });
      void client.auth.getSession().then(({data,error})=>{
        if(error) { if(isOpen)announce(error.message,'error');return; }
        currentUser=data?.session?.user||null;updateHeader();notifyFrames();
      }).catch(err=>{if(isOpen)announce(err.message,'error');});
    } catch(err) {configurationError=`Supabase 연결 오류: ${err.message}`;}
  }
  updateHeader();
})();
