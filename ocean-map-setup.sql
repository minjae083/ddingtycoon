-- 띵타이쿤 WIKI · 배 낚시 해역 (관리자 전용 저장 / 공개 읽기)
-- Supabase 대시보드 SQL Editor에서 1회 실행합니다.
-- 기존에 설정된 public.wiki_admins 테이블과 사용자 계정을 그대로 사용합니다.
-- 테이블이 없다면 기존 supabase-prices.sql의 wiki_admins 생성 구문을 먼저 실행하세요.

CREATE TABLE IF NOT EXISTS public.ocean_map_daily_open (
  day_kst date PRIMARY KEY,
  open_ids text[] NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT ocean_map_three_unique_seas CHECK (
    cardinality(open_ids) = 3
    AND open_ids[1] <> open_ids[2]
    AND open_ids[1] <> open_ids[3]
    AND open_ids[2] <> open_ids[3]
    AND open_ids <@ ARRAY['basic','trash','coral','crimson','ice','deep','poison']::text[]
  )
);

ALTER TABLE public.ocean_map_daily_open ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ocean_map_daily_open FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.ocean_map_daily_open TO anon, authenticated;
DROP POLICY IF EXISTS "everyone sees daily open seas" ON public.ocean_map_daily_open;
CREATE POLICY "everyone sees daily open seas"
ON public.ocean_map_daily_open FOR SELECT TO anon, authenticated USING (true);

-- 클라이언트 측 관리자 표시와 무관하게 서버에서 관리자 여부 검증합니다.
-- 테이블 INSERT/UPDATE/DELETE 권한은 anon/authenticated에 주지 않습니다.
CREATE OR REPLACE FUNCTION public.set_ocean_map_open_seas(p_day date, p_open_ids text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  today_kst date := ((now() AT TIME ZONE 'Asia/Seoul') - interval '3 hour')::date;
BEGIN
  IF actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.wiki_admins AS a WHERE a.user_id = actor
  ) THEN
    RAISE EXCEPTION '관리자만 해역 정보를 수정할 수 있습니다.' USING ERRCODE = '42501';
  END IF;

  IF p_day IS DISTINCT FROM today_kst THEN
    RAISE EXCEPTION '오늘 날짜의 해역만 변경할 수 있습니다.' USING ERRCODE = '22023';
  END IF;

  IF p_open_ids IS NULL OR cardinality(p_open_ids) <> 3
     OR EXISTS (
       SELECT 1 FROM unnest(p_open_ids) AS entry(id)
       WHERE entry.id IS NULL OR entry.id NOT IN ('basic','trash','coral','crimson','ice','deep','poison')
     )
     OR (SELECT count(DISTINCT entry.id) FROM unnest(p_open_ids) AS entry(id)) <> 3
  THEN
    RAISE EXCEPTION '유효한 서로 다른 해역 3곳을 선택해야 합니다.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ocean_map_daily_open(day_kst,open_ids,updated_at,updated_by)
  VALUES (p_day,p_open_ids,now(),actor)
  ON CONFLICT (day_kst) DO UPDATE SET
    open_ids = EXCLUDED.open_ids,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by;
END;
$$;

REVOKE ALL ON FUNCTION public.set_ocean_map_open_seas(date,text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_ocean_map_open_seas(date,text[]) TO authenticated;

-- 실시간 이벤트 알림 활성화. 활성화되어 있지 않아도 브라우저가 20초 간격으로 동기화합니다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'ocean_map_daily_open'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ocean_map_daily_open;
  END IF;
END;
$$;
