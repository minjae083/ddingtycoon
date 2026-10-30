# 띵타이쿤 WIKI v11 — 전문가 스킬 서버 저장 설정

**무료 Supabase + 이메일/비밀번호 로그인**을 사용합니다. 기존 제작 도감, 이미지, 사용자 문구, 효율 비교는 수정하지 않았습니다. GitHub Pages에서 운영할 수 있으며 별도 서버 코드를 배포할 필요가 없습니다.

## 1. Supabase 프로젝트 생성

1. https://supabase.com/dashboard 에 로그인 → **New project** 선택
2. 프로젝트 이름 (예: `ddingtycoon-wiki`)과 데이터베이스 비밀번호를 정하고 Free 프로젝트 생성
3. 프로젝트 생성 후 좌측 **SQL Editor → New query**에서 ZIP 안의 `supabase-schema.sql` 파일 전체를 붙여넣고 **Run** 실행
4. 표 `public.expert_skill_progress`가 생겼는지 Table Editor에서 확인

**보안:** SQL에는 RLS(Row Level Security)가 켜져 있고 자기 계정의 데이터만 조회/추가/수정할 수 있는 정책이 포함되어 있습니다. SQL을 누락한 채 서비스를 운영하지 마세요.

## 2. 사이트 URL과 공개 키 연결

Supabase 프로젝트에서 **Connect** 또는 **Project Settings → API Keys**를 엽니다.

- **Project URL**: `https://xxxxx.supabase.co` 형태
- **Publishable key**: `sb_publishable_...` (예전 프로젝트라면 `anon` 키도 가능)

ZIP 안의 `supabase-config.js`를 메모장으로 열어서 다음과 같이 편집합니다.

```js
window.DDING_SUPABASE_CONFIG = {
  url: "https://여기에프로젝트ID.supabase.co",
  publishableKey: "sb_publishable_여기에공개키"
};
```

**절대** `service_role`, `sb_secret_...` 또는 **데이터베이스 비밀번호**를 넣지 마세요. 공개 키는 사이트 소스에 노출될 수 있지만, 사용자의 접근 권한은 RLS가 검사합니다.

## 3. 로그인 URL 설정

Supabase → **Authentication → URL Configuration**에서:

- **Site URL**: 실제 GitHub Pages 사이트 주소, 예: `https://minjae083.github.io/ddingtycoon/`
- **Redirect URLs**: 같은 경로 아래 `experts.html` 주소를 정확히 추가, 예: `https://minjae083.github.io/ddingtycoon/experts.html`

**중요:** `ddingtycoon`과 `ddingtycooon`처럼 철자가 다른 저장소명을 혼동하지 말고, 현재 브라우저 주소창의 실제 GitHub Pages 경로를 입력하세요. 확인 이메일의 링크를 누르면 임시로 `experts.html`로 이동하는데 정상이며, 그다음 위키 홈페이지로 돌아가면 됩니다.

## 4. 이메일 회원가입 설정 주의

- 기본 설정은 이메일 주소 확인이 필요한 경우가 많습니다.
- **2026년 현재 Supabase 기본 이메일 발송 서비스는 조직 팀원 이메일만 허용하며 시간당 메일 제한**이 있습니다. 본인 계정으로 기능 시험은 할 수 있어도 일반 방문자가 회원가입하려면 **Authentication → SMTP Settings**에서 별도 SMTP 제공업체를 설정해야 합니다.
- `Confirm email`을 임시로 끄면 테스트할 수 있지만 이메일 소유권 검증이 사라지므로 공개 운영에는 권장하지 않습니다.
- 이메일 비밀번호 재설정도 SMTP가 설정되어야 일반 사용자에게 메일이 전달됩니다.

참고: https://supabase.com/docs/guides/auth/auth-smtp

## 5. GitHub Pages에 배포

이 ZIP의 **모든 파일**을 기존 GitHub 프로젝트 폴더에 복사하고, `supabase-config.js`를 본인 키로 수정한 뒤 Git Bash에서:

```bash
git add .
git commit -m "Add Supabase cloud progress sync for expert skills"
git push origin main
```

**새 파일**: `supabase-config.js`, `supabase-schema.sql`, `expert-cloud.js`, 이 설정 문서. 기존 `experts.html`, `wiki.js`, `index.html`도 변경되므로 꼭 덮어써야 합니다.

## 6. 스킬 클라우드 사용법

1. 위키 EXPLORE → **전문가 스킬**로 이동합니다.
2. 상단 **내 전문가 스킬 · 계정 저장**에서 이메일/비밀번호로 가입 및 로그인합니다.
3. 첫 로그인 시 계정에 서버 기록이 없고 이 기기에 레벨이 있다면 기존 레벨을 서버에 올립니다.
4. 서버와 이 기기 레벨이 모두 있는데 다르면 **서버 기록 불러오기 / 이 기기 기록을 서버에 저장** 중 하나를 고르세요. 자동으로 어느 쪽도 덮어쓰지 않습니다.
5. 이후 레벨 변경 시 약 0.7초 후 서버에 자동 저장됩니다. **서버 저장 연결됨** 및 **서버에 스킬 레벨을 저장했어요** 상태를 확인하세요.
6. 다른 기기에서 **같은 이메일**로 로그인하면 서버 기록을 가져옵니다.
7. 로그인하지 않아도 예전처럼 브라우저에 로컬 저장됩니다(`dding-wiki-expert-skill-v8` 키 유지).

**주의**
- 이 기능은 **위키 안에서 지정한 스킬 레벨을 서버에 저장**합니다. 마인크래프트 서버의 실제 스킬 레벨을 자동으로 읽어오는 기능은 아닙니다.
- 두 기기에서 **동시에** 변경하면 마지막으로 저장한 데이터가 이길 수 있습니다. 가능한 한 한 기기씩 사용하세요.
- 무료 Supabase 프로젝트는 장기 미사용 시 일시 정지되거나 한도가 바뀔 수 있습니다.
- 서버 연결 실패 중에도 기기 기록은 남아 있고, 로그인·동기화 실패 시 UI에 오류 메시지가 나옵니다.

### 오류가 나는 경우

- `Invalid API key`: `supabase-config.js`의 **공개 키** 확인
- `relation ... does not exist`: SQL Editor에서 `supabase-schema.sql` 실행 확인
- `permission denied` 또는 `row-level security`: SQL 정책과 로그인 상태 확인
- `Email address not authorized`: 기본 SMTP 제한. SMTP 설정 또는 프로젝트 팀원 이메일로 테스트
- 회원가입 메일에서 `redirect URL is not allowed`: Supabase Authentication의 Redirect URLs 설정 확인
- 기기 저장만 보임: config 파일의 URL/키가 비어 있거나 실제 GitHub에 업로드되지 않음

공식 참고 문서: https://supabase.com/docs/guides/database/postgres/row-level-security
