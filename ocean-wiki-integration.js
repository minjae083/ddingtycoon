/* 해양 제작법 · 강화 제작 시설과 동일한 WIKI 레시피 데이터 모델 */
(function(){
  'use strict';
  const D=window.DDING_WIKI_DATA, O=window.DDING_OCEAN_RECIPES;
  if(!D||!O)return;
  const images={"수호의 정수":"assets/ocean_recipes/수호의_정수.png","파동의 정수":"assets/ocean_recipes/파동의_정수.png","혼란의 정수":"assets/ocean_recipes/혼란의_정수.png","생명의 정수":"assets/ocean_recipes/생명의_정수.png","부식의 정수":"assets/ocean_recipes/부식의_정수.png","물결 수호의 핵":"assets/ocean_recipes/물결_수호의_핵.png","파동 오염의 핵":"assets/ocean_recipes/파동_오염의_핵.png","질서 파괴의 핵":"assets/ocean_recipes/질서_파괴의_핵.png","활력 붕괴의 핵":"assets/ocean_recipes/활력_붕괴의_핵.png","침식 방어의 핵":"assets/ocean_recipes/침식_방어의_핵.png","수호 에센스":"assets/ocean_recipes/수호_에센스.png","파동 에센스":"assets/ocean_recipes/파동_에센스.png","혼란 에센스":"assets/ocean_recipes/혼란_에센스.png","생명 에센스":"assets/ocean_recipes/생명_에센스.png","부식 에센스":"assets/ocean_recipes/부식_에센스.png","활기 보존의 결정":"assets/ocean_recipes/활기_보존의_결정.png","파도 침식의 결정":"assets/ocean_recipes/파도_침식의_결정.png","방어 오염의 결정":"assets/ocean_recipes/방어_오염의_결정.png","격류 재생의 결정":"assets/ocean_recipes/격류_재생의_결정.png","맹독 혼란의 결정":"assets/ocean_recipes/맹독_혼란의_결정.png","수호의 엘릭서":"assets/ocean_recipes/수호의_엘릭서.png","파동의 엘릭서":"assets/ocean_recipes/파동의_엘릭서.png","혼란의 엘릭서":"assets/ocean_recipes/혼란의_엘릭서.png","생명의 엘릭서":"assets/ocean_recipes/생명의_엘릭서.png","부식의 엘릭서":"assets/ocean_recipes/부식의_엘릭서.png","불멸 재생의 영약":"assets/ocean_recipes/불멸_재생의_영약.png","파동 장벽의 영약":"assets/ocean_recipes/파동_장벽의_영약.png","타락 침식의 영약":"assets/ocean_recipes/타락_침식의_영약.png","생명 광란의 영약":"assets/ocean_recipes/생명_광란의_영약.png","맹독 파동의 영약":"assets/ocean_recipes/맹독_파동의_영약.png","굴":"assets/ocean_recipes/굴.png","소라":"assets/ocean_recipes/소라.png","문어":"assets/ocean_recipes/문어.png","미역":"assets/ocean_recipes/미역.png","성게":"assets/ocean_recipes/성게.png","알쏭달쏭 조개":"assets/ocean_recipes/알쏭달쏭_조개.png","영생의 아쿠티스":"assets/ocean_recipes/영생의_아쿠티스.png","크라켄의 광란체":"assets/ocean_recipes/크라켄의_광란체.png","리바이던의 깃털":"assets/ocean_recipes/리바이던의_깃털.png","해구의 파동 코어":"assets/ocean_recipes/해구의_파동_코어.png","침묵의 심해 비약":"assets/ocean_recipes/침묵의_심해_비약.png","청해룡의 날개":"assets/ocean_recipes/청해룡의_날개.png","아쿠아 펄스 파편":"assets/ocean_recipes/아쿠아_펄스_파편.png","나우틸러스의 손":"assets/ocean_recipes/나우틸러스의_손.png","무저의 척추":"assets/ocean_recipes/무저의_척추.png","루키 열쇠":"assets/ocean_recipes/루키_열쇠.png","노멀 열쇠":"assets/ocean_recipes/노멀_열쇠.png","전설 열쇠":"assets/ocean_recipes/전설_열쇠.png","신화 열쇠":"assets/ocean_recipes/신화_열쇠.png","루키 열쇠 조각":"assets/ocean_recipes/루키_열쇠_조각.png","노멀 열쇠 조각":"assets/ocean_recipes/노멀_열쇠_조각.png","전설 열쇠 조각":"assets/ocean_recipes/전설_열쇠_조각.png","신화 열쇠 조각":"assets/ocean_recipes/신화_열쇠_조각.png","금속 재활용품":"assets/ocean_recipes/금속_재활용품.png","합금 재활용품":"assets/ocean_recipes/합금_재활용품.png","합성수지 재활용품":"assets/ocean_recipes/합성수지_재활용품.png","플라스틱 재활용품":"assets/ocean_recipes/플라스틱_재활용품.png","섬유 재활용품":"assets/ocean_recipes/섬유_재활용품.png","조개껍데기 브로치":"assets/ocean_recipes/조개껍데기_브로치.png","푸른 향수병":"assets/ocean_recipes/푸른_향수병.png","자개 손거울":"assets/ocean_recipes/자개_손거울.png","분홍 헤어핀":"assets/ocean_recipes/분홍_헤어핀.png","자개 부채":"assets/ocean_recipes/자개_부채.png","흑진주 시계":"assets/ocean_recipes/흑진주_시계.png","스태미나 드링크 II":"assets/ocean_recipes/스태미나_드링크_II.png","스태미나 드링크 III":"assets/ocean_recipes/스태미나_드링크_III.png","스태미나 드링크 IV":"assets/ocean_recipes/스태미나_드링크_IV.png","무거운 바다 상자":"assets/ocean_recipes/무거운_바다_상자.png","가벼운 바다 상자":"assets/ocean_recipes/가벼운_바다_상자.png","추출된 희석액":"assets/ocean_recipes/추출된_희석액.png"};
  // v39: 독립 페이지와 WIKI 통합 레시피가 동일한 업로드 이미지를 사용하도록 맞춤.
  const suppliedImages={
  "점토": "assets/ocean_recipes/user_items/점토.png",
  "흙": "assets/ocean_recipes/user_items/흙.png",
  "자갈": "assets/ocean_recipes/user_items/자갈.png",
  "화강암": "assets/ocean_recipes/user_items/화강암.png",
  "깐 새우": "assets/ocean_recipes/user_items/깐_새우.png",
  "도미 회": "assets/ocean_recipes/user_items/도미_회.png",
  "청어 회": "assets/ocean_recipes/user_items/청어_회.png",
  "금붕어 회": "assets/ocean_recipes/user_items/금붕어_회.png",
  "농어 회": "assets/ocean_recipes/user_items/농어_회.png",
  "참나무 잎": "assets/ocean_recipes/user_items/참나무_잎.png",
  "가문비나무 잎": "assets/ocean_recipes/user_items/가문비나무_잎.png",
  "자작나무 잎": "assets/ocean_recipes/user_items/자작나무_잎.png",
  "벚나무 잎": "assets/ocean_recipes/user_items/벚나무_잎.png",
  "짙은 참나무 잎": "assets/ocean_recipes/user_items/짙은_참나무_잎.png",
  "켈프 더미": "assets/ocean_recipes/user_items/켈프_더미.png",
  "철 주괴": "assets/ocean_recipes/user_items/철_주괴.png",
  "불우렁쉥이": "assets/ocean_recipes/user_items/불우렁쉥이.png",
  "유리병": "assets/ocean_recipes/user_items/유리병.png",
  "네더랙": "assets/ocean_recipes/user_items/네더랙.png",
  "마그마 블록": "assets/ocean_recipes/user_items/마그마_블록.png",
  "영혼 흙": "assets/ocean_recipes/user_items/영혼_흙.png",
  "진홍빛 자루": "assets/ocean_recipes/user_items/진홍빛_자루.png",
  "뒤틀린 자루": "assets/ocean_recipes/user_items/뒤틀린_자루.png",
  "죽은 관 산호 블록": "assets/ocean_recipes/user_items/죽은_관_산호_블록.png",
  "죽은 사방산호 블록": "assets/ocean_recipes/user_items/죽은_사방산호_블록.png",
  "죽은 거품 산호 블록": "assets/ocean_recipes/user_items/죽은_거품_산호_블록.png",
  "죽은 불 산호 블록": "assets/ocean_recipes/user_items/죽은_불_산호_블록.png",
  "죽은 뇌 산호 블록": "assets/ocean_recipes/user_items/죽은_뇌_산호_블록.png",
  "캔": "assets/ocean_recipes/user_items/캔.png",
  "통조림": "assets/ocean_recipes/user_items/통조림.png",
  "비닐봉지": "assets/ocean_recipes/user_items/비닐봉지.png",
  "패트병": "assets/ocean_recipes/user_items/패트병.png",
  "신발": "assets/ocean_recipes/user_items/신발.png",
  "깨진 조개껍데기": "assets/ocean_recipes/user_items/깨진_조개껍데기.png",
  "노란빛 진주": "assets/ocean_recipes/user_items/노란빛_진주.png",
  "푸른빛 진주": "assets/ocean_recipes/user_items/푸른빛_진주.png",
  "청록빛 진주": "assets/ocean_recipes/user_items/청록빛_진주.png",
  "분홍빛 진주": "assets/ocean_recipes/user_items/분홍빛_진주.png",
  "보라빛 진주": "assets/ocean_recipes/user_items/보라빛_진주.png",
  "흑진주": "assets/ocean_recipes/user_items/흑진주.png",
  "양동이": "assets/ocean_recipes/user_items/양동이.png",
  "유리판": "assets/ocean_recipes/user_items/유리판.png",
  "대나무": "assets/ocean_recipes/user_items/대나무.png",
  "분홍 꽃잎": "assets/ocean_recipes/user_items/분홍_꽃잎.png",
  "자수정 조각": "assets/ocean_recipes/user_items/자수정_조각.png",
  "막대기": "assets/ocean_recipes/user_items/막대기.png",
  "흑요석": "assets/ocean_recipes/user_items/흑요석.png",
  "시계": "assets/ocean_recipes/user_items/시계.png",
  "스태미나 드링크 I": "assets/ocean_recipes/user_items/스태미나_드링크_I.png",
  "무거운 녹슨 바다 상자": "assets/ocean_recipes/user_items/무거운_녹슨_바다_상자.png",
  "가벼운 녹슨 바다 상자": "assets/ocean_recipes/user_items/가벼운_녹슨_바다_상자.png",
  "페트병": "assets/ocean_recipes/user_items/패트병.png",
  "녹슨 무거운 바다 상자": "assets/ocean_recipes/user_items/무거운_녹슨_바다_상자.png",
  "녹슨 가벼운 바다 상자": "assets/ocean_recipes/user_items/가벼운_녹슨_바다_상자.png"
};
  Object.assign(images,suppliedImages);
  const oceanIds=['alchemy','precision-alchemy','marine'];
  const stars=n=>'★'.repeat(n||0);
  const normalize=name=>String(name||'').replace(/\s*★+\s*$/,'').trim();
  const imageFor=name=>{
    const key=normalize(name);
    const aliased=key==='해구 파동의 코어'?'해구의 파동 코어':key;
    return images[key]||images[aliased]||null;
  };
  const toName=r=>r.name+(r.stars?' '+stars(r.stars):'');
  // Preserve existing items and sources. Add only names missing from the existing WIKI.
  function registerItem(name,craftable){
    if(!name)return;
    const image=imageFor(name);
    if(!D.items[name])D.items[name]={name,image,price:null,craftable:!!craftable};
    else if(image && (Object.hasOwn(suppliedImages,normalize(name)) || !D.items[name].image))D.items[name].image=image;
  }
  if(!D.categories.some(x=>x.id==='sea'))D.categories.push({
    id:'sea',title:'해양',english:'OCEAN CRAFTING',description:'연금 제작, 정밀 연금, 해양 제작',
    facilityIds:oceanIds,banner:null,theme:'blue',icon:'waves'
  });
  for(const [id,detail] of Object.entries(O.facilities)){
    const groups=detail.groupInfo.map((group,i)=>({id:`ocean-${id}-${i}`,title:group,description:'',number:null,recipes:[]}));
    const index=new Map(groups.map(group=>[group.title,group]));
    for(const r of O.recipes.filter(x=>x.facility===id)){
      const name=toName(r);
      const sum=new Map();
      for(const item of r.ingredients)sum.set(item.name,(sum.get(item.name)||0)+item.quantity);
      const recipe={name,ingredients:[...sum].map(([name,qty])=>({name,qty})),output:r.output,
        kind:r.group,rank:null,price:null,method:null,note:'제작 재료',oceanId:r.id,oceanFacility:id};
      index.get(r.group).recipes.push(recipe);
      registerItem(name,true);
      for(const ing of recipe.ingredients)registerItem(ing.name,false);
      const entries=D.recipesByItem[name]||(D.recipesByItem[name]=[]);
      if(!entries.some(x=>x.facility===id&&x.recipe.oceanId===r.id))entries.push({facility:id,group:r.group,recipe});
    }
    D.facilities[id]={id,category:'sea',title:detail.name,description:detail.description,banner:null,groups};
  }
  for(const shop of Object.values(O.shops))for(const item of shop.items)registerItem(item[0],false);
  // The shop calls the same 2-star core by a slightly different label.
  const alias='해구의 파동 코어 ★★',canonical='해구 파동의 코어 ★★';
  if(D.recipesByItem[canonical])D.recipesByItem[alias]=D.recipesByItem[canonical];
  if(!D.items[alias])registerItem(alias,true);
})();
