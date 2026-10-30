-- 띵타이쿤 WIKI v13: public cooking prices + admin-only updates.
-- Supabase Dashboard > SQL Editor에서 한 번 실행.
-- 기존 expert_skill_progress 테이블은 건드리지 않습니다.

CREATE TABLE IF NOT EXISTS public.wiki_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.wiki_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wiki_admins FROM anon, authenticated;
GRANT SELECT ON public.wiki_admins TO authenticated;
DROP POLICY IF EXISTS "admin own membership" ON public.wiki_admins;
CREATE POLICY "admin own membership" ON public.wiki_admins FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.dish_prices (
  name text PRIMARY KEY,
  category text NOT NULL CHECK(category IN ('일반 요리','황금 요리')),
  price integer NOT NULL CHECK(price BETWEEN 0 AND 99999999),
  previous_price integer NOT NULL CHECK(previous_price BETWEEN 0 AND 99999999),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.dish_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dish_prices FROM anon, authenticated;
GRANT SELECT ON public.dish_prices TO anon, authenticated;
DROP POLICY IF EXISTS "everyone can see prices" ON public.dish_prices;
CREATE POLICY "everyone can see prices" ON public.dish_prices FOR SELECT TO anon,authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.dish_price_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL REFERENCES public.dish_prices(name),
  old_price integer NOT NULL,
  new_price integer NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.dish_price_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dish_price_history FROM anon, authenticated;
GRANT SELECT ON public.dish_price_history TO authenticated;
DROP POLICY IF EXISTS "admins see price history" ON public.dish_price_history;
CREATE POLICY "admins see price history" ON public.dish_price_history FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.wiki_admins a WHERE a.user_id=(SELECT auth.uid())));

-- 첫 실행에서만 최신 30개 가격을 등록합니다. SQL을 재실행해도 관리자 수정값을 덮어쓰지 않습니다.
INSERT INTO public.dish_prices(name,category,price,previous_price) VALUES
  ('토마토 스파게티','일반 요리',507,307),
  ('어니언 링','일반 요리',587,334),
  ('갈릭 케이크','일반 요리',364,237),
  ('삼겹살 토마토 찌개','일반 요리',1160,405),
  ('삼색 아이스크림','일반 요리',1444,1308),
  ('마늘 양갈비 핫도그','일반 요리',870,781),
  ('달콤 시리얼','일반 요리',1540,1052),
  ('로스트 치킨 파이','일반 요리',1148,1024),
  ('스윗 치킨 햄버거','일반 요리',1288,1738),
  ('토마토 파인애플 피자','일반 요리',1042,814),
  ('양파 수프','일반 요리',1405,1908),
  ('허브 삼겹살 찜','일반 요리',760,1313),
  ('토마토 라자냐','일반 요리',1188,2720),
  ('딥 크림 빠네','일반 요리',1883,942),
  ('트리플 소갈비 꼬치','일반 요리',2289,1764),
  ('황금 토마토 스파게티','황금 요리',853,518),
  ('황금 어니언 링','황금 요리',987,562),
  ('황금 갈릭 케이크','황금 요리',612,399),
  ('황금 삼겹살 토마토 찌개','황금 요리',1951,681),
  ('황금 삼색 아이스크림','황금 요리',2429,2196),
  ('황금 마늘 양갈비 핫도그','황금 요리',1463,1280),
  ('황금 달콤 시리얼','황금 요리',2590,1789),
  ('황금 로스트 치킨 파이','황금 요리',1931,1722),
  ('황금 스윗 치킨 햄버거','황금 요리',2166,2923),
  ('황금 토마토 파인애플 피자','황금 요리',1752,1369),
  ('황금 양파 수프','황금 요리',2363,3209),
  ('황금 허브 삼겹살 찜','황금 요리',1278,2208),
  ('황금 토마토 라자냐','황금 요리',1998,4574),
  ('황금 딥 크림 빠네','황금 요리',3167,1584),
  ('황금 트리플 소갈비 꼬치','황금 요리',3850,2967)
ON CONFLICT (name) DO NOTHING;

-- Security definer: bypasses write RLS only after checking auth.uid() in wiki_admins.
CREATE OR REPLACE FUNCTION public.update_dish_prices(changes jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  entry record;
  before_price integer;
  next_price integer;
  modified integer := 0;
BEGIN
  IF actor IS NULL OR NOT EXISTS (SELECT 1 FROM public.wiki_admins a WHERE a.user_id=actor) THEN
    RAISE EXCEPTION '관리자만 가격을 수정할 수 있습니다.' USING ERRCODE='42501';
  END IF;
  IF changes IS NULL OR jsonb_typeof(changes)<>'object' THEN
    RAISE EXCEPTION '가격 입력 형식이 잘못됐습니다.';
  END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(changes)) NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION '1~30개 가격을 입력하세요.';
  END IF;
  FOR entry IN SELECT key,value FROM jsonb_each_text(changes) LOOP
    IF entry.value !~ '^[0-9]{1,8}$' THEN RAISE EXCEPTION '가격은 0~99,999,999 정수여야 합니다: %',entry.key; END IF;
    next_price:=entry.value::integer;
    SELECT p.price INTO before_price FROM public.dish_prices p WHERE p.name=entry.key FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION '등록되지 않은 요리: %',entry.key; END IF;
    IF before_price<>next_price THEN
      UPDATE public.dish_prices SET price=next_price,previous_price=before_price,updated_at=now(),updated_by=actor
        WHERE name=entry.key;
      INSERT INTO public.dish_price_history(name,old_price,new_price,changed_by)
        VALUES(entry.key,before_price,next_price,actor);
      modified:=modified+1;
    END IF;
  END LOOP;
  RETURN modified;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_dish_prices(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_dish_prices(jsonb) TO authenticated;
