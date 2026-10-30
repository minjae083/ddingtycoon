/* 띵타이쿤 WIKI · 전문가 스킬 클라우드 저장 (Supabase Auth + RLS)
 * This file contains NO server secret. The public key is in supabase-config.js.
 * The pre-existing skill tree and localStorage progress work without Supabase.
 */
(() => {
  'use strict';
  const panel = document.getElementById('skillCloudPanel');
  const content = document.getElementById('cloudContent');
  const stateChip = document.getElementById('cloudState');
  const messageBox = document.getElementById('cloudMessage');
  const bridge = window.DDING_SKILL_BRIDGE;
  if (!panel || !bridge) return;

  const cfg = window.DDING_SUPABASE_CONFIG || {};
  const url = String(cfg.url || '').trim().replace(/\/$/, '');
  const publicKey = String(cfg.publishableKey || '').trim();
  const hasConfig = /^https:\/\/[^/\s]+$/i.test(url) && publicKey.length > 12;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const maxes = bridge.maxLevels();
  function cleanLevels(raw) {
    const cleaned = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return cleaned;
    for (const [k, max] of Object.entries(maxes)) {
      const n = Number(raw[k]);
      if (Number.isInteger(n) && n > 0 && n <= max) cleaned[k] = n;
    }
    return cleaned;
  }
  function sameLevels(a, b) {
    const first = cleanLevels(a), second = cleanLevels(b);
    return Object.keys(maxes).every(k => (first[k] || 0) === (second[k] || 0));
  }
  const learnedCount = levels => Object.keys(cleanLevels(levels)).length;
  // Separate guest and signed-in progress so accounts cannot silently inherit another user's levels.
  const ACTIVE_UID_KEY = 'dding-wiki-skill-active-user-v11';
  const GUEST_KEY = 'dding-wiki-skill-guest-v11';
  const accountKey = uid => `dding-wiki-skill-account-v11-${uid}`;
  function getStored(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function putStored(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function delStored(key) { try { localStorage.removeItem(key); } catch (_) {} }
  function cachedLevels(key) {
    try { const value = getStored(key); return value === null ? null : cleanLevels(JSON.parse(value)); }
    catch (_) { return null; }
  }
  let accountUrl = '';
  try { accountUrl = new URL('experts.html', document.baseURI).href.split('#')[0].split('?')[0]; }
  catch (_) { accountUrl = window.location.href.split('#')[0]; }

  let db = null;
  let user = null;
  let generation = 0;
  let ready = false;
  let serverLevels = null;   // Set only if the local and server records conflict.
  let loading = false;
  let saving = false;
  let dirty = false;
  let saveTimer = null;
  let busyAuth = false;
  let recovering = false;
  let banner = '';
  let bannerKind = '';
  let lastSaved = '';

  function chip(label, kind = '') {
    stateChip.textContent = label;
    stateChip.dataset.kind = kind;
  }
  function notice(text, kind = '') {
    banner = text;
    bannerKind = kind;
    messageBox.textContent = text;
    messageBox.dataset.kind = kind;
  }
  function renderPanel() {
    if (hasConfig && !db) {
      chip('연결 실패', 'error');
      content.innerHTML = '<p class="cloud-small">로그인 프로그램을 불러오지 못했어요. 인터넷 연결을 확인하고 페이지를 새로고침해 주세요. 기기 저장은 계속 동작합니다.</p>';
    } else if (recovering) {
      chip('비밀번호 변경', 'warn');
      content.innerHTML = `<form id="cloudResetForm" class="cloud-form" autocomplete="on">
        <input class="cloud-input" type="password" id="cloudNewPassword" autocomplete="new-password" minlength="6" required placeholder="새 비밀번호 (6자 이상)" aria-label="새 비밀번호">
        <button class="cloud-btn primary" type="submit" ${busyAuth ? 'disabled' : ''}>비밀번호 변경</button>
        <button type="button" class="cloud-btn" data-cloud-action="cancel-recovery">취소</button>
      </form>`;
    } else if (!user) {
      chip('로그인 전', 'warn');
      content.innerHTML = `<form id="cloudLoginForm" class="cloud-form" autocomplete="on">
        <input class="cloud-input" id="cloudEmail" type="email" autocomplete="email" maxlength="254" required placeholder="이메일" aria-label="이메일">
        <input class="cloud-input" id="cloudPassword" type="password" autocomplete="current-password" minlength="6" required placeholder="비밀번호 (6자 이상)" aria-label="비밀번호">
        <button class="cloud-btn primary" type="submit" ${busyAuth ? 'disabled' : ''}>로그인</button>
      </form>
      <div class="cloud-row" style="margin-top:7px"><button type="button" data-cloud-action="signup" class="cloud-link">처음이신가요? 회원가입</button><span style="color:#d9cdee">·</span><button type="button" data-cloud-action="reset-email" class="cloud-link">비밀번호 찾기</button></div>
`;
    } else if (loading) {
      chip('동기화 확인 중');
      content.innerHTML = `<div class="cloud-row"><span class="cloud-account">${escapeHtml(user.email || '로그인됨')}</span><span class="cloud-small">서버 기록 확인 중…</span></div>`;
    } else if (serverLevels !== null) {
      chip('기록 선택 필요', 'warn');
      content.innerHTML = `<div class="cloud-row"><span class="cloud-account">${escapeHtml(user.email || '로그인됨')}</span></div>
        <div class="cloud-conflict"><b>서버 기록과 이 기기 기록이 달라요.</b>
          <p>서버에서 배운 스킬 ${learnedCount(serverLevels)}개 / 이 기기에서 배운 스킬 ${learnedCount(bridge.get())}개. 자동으로 덮어쓰지 않았으니 사용할 기록을 선택해 주세요.</p>
          <div class="cloud-row"><button class="cloud-btn primary" data-cloud-action="use-server" type="button">서버 기록 불러오기</button><button class="cloud-btn" data-cloud-action="use-device" type="button">이 기기 기록을 서버에 저장</button><button class="cloud-btn" data-cloud-action="signout" type="button">로그아웃</button></div>
        </div>`;
    } else {
      chip(bannerKind === 'error' && dirty ? '저장 오류' : saving || dirty ? '서버 저장 중' : ready ? '서버 저장 연결됨' : '연결 확인 중', bannerKind === 'error' && dirty ? 'error' : ready && !dirty && !saving ? 'ok' : 'warn');
      content.innerHTML = `<div class="cloud-row"><span class="cloud-account">${escapeHtml(user.email || '로그인됨')}</span>
        <button type="button" class="cloud-btn primary" data-cloud-action="save-now" ${loading || saving ? 'disabled' : ''}>지금 저장</button>
        <button type="button" class="cloud-btn" data-cloud-action="refresh" ${loading || saving ? 'disabled' : ''}>서버 기록 새로고침</button>
        <button type="button" class="cloud-btn" data-cloud-action="signout" ${saving ? 'disabled' : ''}>로그아웃</button></div>
      <p class="cloud-small">스킬 레벨을 변경하면 자동으로 저장돼요.${lastSaved ? ` 마지막 저장: ${escapeHtml(lastSaved)}` : ''}</p>`;
    }
    messageBox.textContent = banner;
    messageBox.dataset.kind = bannerKind;
    try{if(window.parent!==window)window.parent.postMessage({type:'dding-account-state',signedIn:!!user},window.location.origin);}catch(_){}
  }

  window.addEventListener('message', e => {
    if (e.source !== window.parent || e.origin !== location.origin || e.data?.type !== 'dding-auth-updated') return;
    if (!db) return;
    void db.auth.getSession().then(({data,error}) => {
      if (error) { notice(`로그인 상태 확인 실패: ${error.message}`, 'error'); renderPanel(); return; }
      handleSession(data?.session || null);
    }).catch(err => { notice(`로그인 상태 확인 실패: ${err.message}`, 'error'); renderPanel(); });
  });
  window.addEventListener('message',(e)=>{
    if(e.source!==window.parent||e.origin!==location.origin||e.data?.type!=='dding-focus-login')return;
    const panel=document.getElementById('skillCloudPanel');
    panel?.scrollIntoView({behavior:'smooth',block:'start'});
    const email=document.getElementById('cloudEmail');
    if(email)email.focus({preventScroll:true});
  });

  function queueSave() {
    if (!db || !user || !ready || serverLevels !== null || loading) return;
    dirty = true;
    chip('저장 예정', 'warn');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; void flushSave(); }, 700);
  }
  async function flushSave() {
    if (!db || !user || !ready || serverLevels !== null || loading) return false;
    if (saving) return false;
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!dirty) return true;
    saving = true;
    const epoch = generation;
    const id = user.id;
    chip('서버 저장 중', 'warn');
    try {
      while (dirty && generation === epoch && user?.id === id) {
        dirty = false;
        const levels = cleanLevels(bridge.get());
        const { error } = await db.from('expert_skill_progress').upsert({
          user_id: id,
          levels,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (generation !== epoch || user?.id !== id) return false;
        if (error) {
          dirty = true;
          notice(`서버 저장에 실패했어요: ${error.message}. 기기 기록은 남아 있어요. '지금 저장'으로 다시 시도해 주세요.`, 'error');
          return false;
        }
        lastSaved = new Date().toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'});
        notice('서버에 스킬 레벨을 저장했어요.', 'ok');
      }
      return true;
    } catch (e) {
      if (generation === epoch) {
        dirty = true;
        notice(`서버 연결을 확인해 주세요: ${e.message || '알 수 없는 오류'}. 기기 기록은 유지돼요.`, 'error');
      }
      return false;
    } finally {
      saving = false;
      renderPanel();
    }
  }
  async function loadCloud(id, epoch) {
    if (!db || !id) return;
    loading = true;
    ready = false;
    serverLevels = null;
    lastSaved = '';
    renderPanel();
    try {
      const { data, error } = await db.from('expert_skill_progress')
        .select('levels,updated_at').eq('user_id', id).maybeSingle();
      if (generation !== epoch || user?.id !== id) return;
      if (error) throw error;
      const local = cleanLevels(bridge.get());
      if (!data) {
        loading = false;
        ready = true;
        if (learnedCount(local)) {
          notice('이 계정에는 저장된 기록이 없어 이 기기의 기존 레벨을 처음으로 서버에 올립니다.', 'ok');
          dirty = true;
          renderPanel();
          await flushSave();
        } else {
          notice('새 계정이에요. 이제 레벨을 바꾸면 자동으로 서버에 저장돼요.', 'ok');
          renderPanel();
        }
      } else {
        const remote = cleanLevels(data.levels);
        loading = false;
        if (sameLevels(remote, local)) {
          ready = true;
          notice('서버와 기기의 스킬 기록이 일치해요. 자동 저장이 켜졌어요.', 'ok');
        } else if (!learnedCount(local)) {
          bridge.replace(remote);
          ready = true;
          notice('서버에서 스킬 레벨을 불러왔어요.', 'ok');
        } else {
          serverLevels = remote;
          ready = false;
          notice('기록이 달라서 안전하게 자동 덮어쓰기를 중지했어요.', '');
        }
        renderPanel();
      }
    } catch (e) {
      if (generation !== epoch) return;
      loading = false;
      ready = false;
      notice(`서버 기록을 불러오지 못했어요: ${e.message || '연결 오류'}. 스킬은 기기에 저장돼요.`, 'error');
      renderPanel();
    }
  }

  function handleSession(session) {
    const nextUser = session?.user || null;
    const nextId = nextUser?.id || null;
    const activeId = getStored(ACTIVE_UID_KEY);
    if (nextId === (user?.id || null) && !(nextId === null && activeId)) return;
    generation++;
    ready = false;
    dirty = false;
    serverLevels = null;
    saving = false;
    lastSaved = '';
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }

    // Preserve the last account's device copy and restore the guest copy on logout.
    if (activeId && activeId !== nextId) {
      putStored(accountKey(activeId), JSON.stringify(cleanLevels(bridge.get())));
    }
    if (nextId) {
      if (!activeId && getStored(GUEST_KEY) === null) {
        putStored(GUEST_KEY, JSON.stringify(cleanLevels(bridge.get())));
      }
      if (activeId !== nextId) {
        const cached = cachedLevels(accountKey(nextId));
        if (cached !== null) bridge.replace(cached);
        else if (activeId) bridge.replace({});
        // When logging in from anonymous mode, migrate guest levels if the cloud is empty.
      }
      putStored(ACTIVE_UID_KEY, nextId);
    } else if (activeId) {
      const guest = cachedLevels(GUEST_KEY);
      bridge.replace(guest || {});
      delStored(ACTIVE_UID_KEY);
    }

    user = nextUser;
    if (!user) {
      loading = false;
      notice('로그아웃했어요. 계정 기록은 서버에, 로그인 전 기록은 이 기기에 따로 보관돼요.', '');
      renderPanel();
      return;
    }
    const currentEpoch = generation;
    // Avoid Supabase async requests inside an onAuthStateChange callback.
    const signedInUserId = nextId;
    setTimeout(() => { if (generation === currentEpoch) void loadCloud(signedInUserId, currentEpoch); }, 0);
    renderPanel();
  }
  function credentials() {
    const email = document.getElementById('cloudEmail')?.value?.trim() || '';
    const password = document.getElementById('cloudPassword')?.value || '';
    return { email, password };
  }
  async function loginOrRegister(action) {
    if (busyAuth) return;
    if (!db) { notice('로그인 연결 정보를 확인해 주세요.', 'error'); return; }
    const {email, password} = credentials();
    if (!email || !email.includes('@')) {notice('올바른 이메일 주소를 입력해 주세요.', 'error');return;}
    if (password.length < 6) {notice('비밀번호는 6자 이상으로 입력해 주세요.', 'error');return;}
    busyAuth = true;
    renderPanel();
    try {
      const result = action === 'register'
        ? await db.auth.signUp({email, password, options: {emailRedirectTo: accountUrl}})
        : await db.auth.signInWithPassword({email, password});
      if (result.error) throw result.error;
      if (action === 'register' && !result.data?.session) {
        notice('가입 요청을 보냈어요. 이메일로 도착한 확인 링크를 누른 뒤 로그인해 주세요. 스팸함도 확인해 보세요.', 'ok');
      } else if (action === 'register') {
        notice('회원가입과 로그인이 완료됐어요. 서버 기록을 확인합니다.', 'ok');
      } else {
        notice('로그인했어요. 서버 기록을 확인합니다.', 'ok');
      }
    } catch (e) {
      notice(`인증에 실패했어요: ${e.message || '알 수 없는 오류'}`, 'error');
    } finally {
      busyAuth = false;
      renderPanel();
    }
  }
  async function resetEmail() {
    if (!db) { notice('로그인 연결 정보를 확인해 주세요.', 'error'); return; }
    const email = document.getElementById('cloudEmail')?.value?.trim() || '';
    if (!email.includes('@')) {notice('비밀번호를 찾을 이메일 주소를 먼저 입력해 주세요.', 'error');return;}
    try {
      const { error } = await db.auth.resetPasswordForEmail(email, {redirectTo: accountUrl});
      if (error) throw error;
      notice('해당 이메일로 비밀번호 재설정 메일을 요청했어요. 메일함을 확인해 주세요.', 'ok');
    } catch (e) {notice(`재설정 요청에 실패했어요: ${e.message}`, 'error');}
  }
  async function signOut() {
    if (dirty || saving) {
      const ok = await flushSave();
      if (!ok) {notice('아직 서버에 저장되지 않은 기록이 있어요. 먼저 지금 저장을 다시 시도해 주세요.', 'error'); return;}
    }
    try {
      const { error } = await db.auth.signOut();
      if (error) throw error;
    } catch (e) {notice(`로그아웃 실패: ${e.message}`, 'error');}
  }
  async function reload() {
    if (!user || !db) return;
    if (dirty && !(await flushSave())) return;
    const epoch = generation;
    await loadCloud(user.id, epoch);
  }
  panel.addEventListener('submit', e => {
    if (e.target.id === 'cloudLoginForm') {e.preventDefault(); void loginOrRegister('login');}
    if (e.target.id === 'cloudResetForm') {
      e.preventDefault();
      const pwd = document.getElementById('cloudNewPassword')?.value || '';
      if (pwd.length < 6) {notice('비밀번호는 6자 이상이어야 해요.', 'error');return;}
      void (async () => {
        busyAuth = true;renderPanel();
        try {const {error} = await db.auth.updateUser({password:pwd});if(error)throw error;recovering=false;notice('비밀번호 변경을 완료했어요.', 'ok');}
        catch(err){notice(`변경 실패: ${err.message}`, 'error');}
        finally{busyAuth=false;renderPanel();}
      })();
    }
  });
  panel.addEventListener('click', e => {
    const action = e.target.closest('[data-cloud-action]')?.dataset.cloudAction;
    if (!action) return;
    if (action === 'signup') void loginOrRegister('register');
    else if (action === 'reset-email') void resetEmail();
    else if (action === 'signout') void signOut();
    else if (action === 'refresh') void reload();
    else if (action === 'save-now') {dirty=true;void flushSave();}
    else if (action === 'use-server' && serverLevels !== null) {
      bridge.replace(serverLevels);serverLevels=null;ready=true;dirty=false;
      notice('서버 기록을 선택했어요. 이후부터 변경할 때마다 자동 저장됩니다.', 'ok');renderPanel();
    } else if (action === 'use-device' && serverLevels !== null) {
      serverLevels=null;ready=true;dirty=true;
      notice('이 기기 기록을 서버로 올리고 있어요.', 'ok');renderPanel();void flushSave();
    } else if (action === 'cancel-recovery') {recovering=false;renderPanel();}
  });
  window.addEventListener('dding:skill-updated', () => {
    if (serverLevels !== null) {
      notice('기록 선택 전 변경한 레벨은 이 기기에만 저장되고 있어요.', '');
    } else if (user && !ready) {
      notice('서버 연결을 확인하는 동안 변경한 레벨은 이 기기에 저장돼요.', '');
    } else {
      queueSave();
    }
  });

  if (hasConfig && window.supabase?.createClient) {
    try {
      db = window.supabase.createClient(url, publicKey, {auth: {
        persistSession: true, autoRefreshToken: true, detectSessionInUrl: true
      }});
      db.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          recovering = true; renderPanel();
        }
        handleSession(session);
      });
    } catch (e) {
      db = null;
      notice(`서버 설정을 확인해 주세요: ${e.message}`, 'error');
    }
  }
  renderPanel();
})();
