-- 1) WIKI에서 로그인할 이메일 계정을 먼저 생성합니다.
-- 2) Supabase Dashboard > Authentication > Users에서 해당 계정의 User UID(UUID)를 복사합니다.
-- 3) 아래 REPLACE_WITH_USER_UUID만 실제 UUID로 바꿔서 SQL Editor에서 실행합니다.
-- URL, Publishable key, 이메일 주소를 넣는 곳이 아닙니다.
INSERT INTO public.wiki_admins(user_id)
VALUES ('REPLACE_WITH_USER_UUID'::uuid)
ON CONFLICT (user_id) DO NOTHING;

-- 등록 확인용 SQL (관리자 대시보드에서만 실행):
SELECT user_id FROM public.wiki_admins;
