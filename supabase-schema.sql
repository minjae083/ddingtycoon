-- Supabase Dashboard > SQL Editor 에서 한 번만 실행하세요.
-- 스킬 레벨은 사용자 계정마다 한 줄만 보관합니다.
CREATE TABLE IF NOT EXISTS public.expert_skill_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  levels jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT progress_levels_object CHECK (jsonb_typeof(levels) = 'object')
);

ALTER TABLE public.expert_skill_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.expert_skill_progress FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.expert_skill_progress TO authenticated;

DROP POLICY IF EXISTS "expert progress read own" ON public.expert_skill_progress;
CREATE POLICY "expert progress read own"
ON public.expert_skill_progress FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "expert progress insert own" ON public.expert_skill_progress;
CREATE POLICY "expert progress insert own"
ON public.expert_skill_progress FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "expert progress update own" ON public.expert_skill_progress;
CREATE POLICY "expert progress update own"
ON public.expert_skill_progress FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
