-- 띵타이쿤 WIKI: 공예품 상점(포스) 공용 시세 + 관리자 전용 수정
-- Supabase Dashboard > SQL Editor에서 한 번 실행합니다.
-- 이미 수정된 서버 가격은 ON CONFLICT DO NOTHING으로 보호합니다.

CREATE TABLE IF NOT EXISTS public.wiki_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.wiki_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wiki_admins FROM anon, authenticated;
GRANT SELECT ON public.wiki_admins TO authenticated;
DROP POLICY IF EXISTS "admin own membership" ON public.wiki_admins;
CREATE POLICY "admin own membership" ON public.wiki_admins
 FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.pos_craft_prices (
  name text PRIMARY KEY,
  category text NOT NULL CHECK(category IN ('Normal','Rare','Epic','Legendary')),
  price integer NOT NULL CHECK(price BETWEEN 0 AND 99999999),
  previous_price integer NOT NULL CHECK(previous_price BETWEEN 0 AND 99999999),
  updated_at timestamptz,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.pos_craft_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pos_craft_prices FROM anon, authenticated;
GRANT SELECT ON public.pos_craft_prices TO anon, authenticated;
DROP POLICY IF EXISTS "everyone can see pos prices" ON public.pos_craft_prices;
CREATE POLICY "everyone can see pos prices" ON public.pos_craft_prices
 FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.pos_craft_prices(name,category,price,previous_price) VALUES
 ('조개껍데기 브로치','Normal',29447,23662),
 ('푸른 향수병','Rare',43112,65463),
 ('자개 손거울','Rare',131354,77458),
 ('분홍 헤어핀','Epic',147481,227787),
 ('자개 부채','Epic',248700,229774),
 ('흑진주 시계','Legendary',918190,927784)
ON CONFLICT(name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.pos_craft_price_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL REFERENCES public.pos_craft_prices(name),
  old_price integer NOT NULL,
  new_price integer NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.pos_craft_price_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pos_craft_price_history FROM anon, authenticated;
GRANT SELECT ON public.pos_craft_price_history TO authenticated;
DROP POLICY IF EXISTS "admins see pos price history" ON public.pos_craft_price_history;
CREATE POLICY "admins see pos price history" ON public.pos_craft_price_history
 FOR SELECT TO authenticated
 USING (EXISTS(SELECT 1 FROM public.wiki_admins a WHERE a.user_id = (SELECT auth.uid())));

-- 직접 UPDATE는 차단하고, 인증된 관리자만 이 함수를 통해 변경합니다.
CREATE OR REPLACE FUNCTION public.update_pos_craft_prices(changes jsonb)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
 actor uuid := auth.uid();
 entry record;
 old_value integer;
 new_value integer;
 modified integer := 0;
BEGIN
 IF actor IS NULL OR NOT EXISTS (SELECT 1 FROM public.wiki_admins a WHERE a.user_id=actor) THEN
   RAISE EXCEPTION '관리자만 공예품 시세를 수정할 수 있습니다.' USING ERRCODE='42501';
 END IF;
 IF changes IS NULL OR jsonb_typeof(changes)<>'object' THEN
   RAISE EXCEPTION '가격 입력 형식이 잘못됐습니다.';
 END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(changes)) NOT BETWEEN 1 AND 6 THEN
   RAISE EXCEPTION '1~6개 가격을 입력하세요.';
 END IF;
 FOR entry IN SELECT key,value FROM jsonb_each_text(changes) LOOP
   IF entry.value !~ '^[0-9]{1,8}$' THEN
      RAISE EXCEPTION '가격은 0~99,999,999 정수여야 합니다: %',entry.key;
   END IF;
   new_value:=entry.value::integer;
   SELECT p.price INTO old_value FROM public.pos_craft_prices p WHERE p.name=entry.key FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION '등록되지 않은 공예품: %',entry.key; END IF;
   IF old_value<>new_value THEN
      UPDATE public.pos_craft_prices SET price=new_value,previous_price=old_value,updated_at=now(),updated_by=actor WHERE name=entry.key;
      INSERT INTO public.pos_craft_price_history(name,old_price,new_price,changed_by)
        VALUES(entry.key,old_value,new_value,actor);
      modified:=modified+1;
   END IF;
 END LOOP;
 RETURN modified;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_pos_craft_prices(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_pos_craft_prices(jsonb) TO authenticated;
NOTIFY pgrst, 'reload schema';
