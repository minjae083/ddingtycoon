/* Shared, read-only cooking prices. Only the authenticated admin RPC can update the database. */
(() => {
'use strict';
const initial={"토마토 스파게티":{"name":"토마토 스파게티","category":"일반 요리","price":507,"previous_price":307,"updated_at":null},"어니언 링":{"name":"어니언 링","category":"일반 요리","price":587,"previous_price":334,"updated_at":null},"갈릭 케이크":{"name":"갈릭 케이크","category":"일반 요리","price":364,"previous_price":237,"updated_at":null},"삼겹살 토마토 찌개":{"name":"삼겹살 토마토 찌개","category":"일반 요리","price":1160,"previous_price":405,"updated_at":null},"삼색 아이스크림":{"name":"삼색 아이스크림","category":"일반 요리","price":1444,"previous_price":1308,"updated_at":null},"마늘 양갈비 핫도그":{"name":"마늘 양갈비 핫도그","category":"일반 요리","price":870,"previous_price":781,"updated_at":null},"달콤 시리얼":{"name":"달콤 시리얼","category":"일반 요리","price":1540,"previous_price":1052,"updated_at":null},"로스트 치킨 파이":{"name":"로스트 치킨 파이","category":"일반 요리","price":1148,"previous_price":1024,"updated_at":null},"스윗 치킨 햄버거":{"name":"스윗 치킨 햄버거","category":"일반 요리","price":1288,"previous_price":1738,"updated_at":null},"토마토 파인애플 피자":{"name":"토마토 파인애플 피자","category":"일반 요리","price":1042,"previous_price":814,"updated_at":null},"양파 수프":{"name":"양파 수프","category":"일반 요리","price":1405,"previous_price":1908,"updated_at":null},"허브 삼겹살 찜":{"name":"허브 삼겹살 찜","category":"일반 요리","price":760,"previous_price":1313,"updated_at":null},"토마토 라자냐":{"name":"토마토 라자냐","category":"일반 요리","price":1188,"previous_price":2720,"updated_at":null},"딥 크림 빠네":{"name":"딥 크림 빠네","category":"일반 요리","price":1883,"previous_price":942,"updated_at":null},"트리플 소갈비 꼬치":{"name":"트리플 소갈비 꼬치","category":"일반 요리","price":2289,"previous_price":1764,"updated_at":null},"황금 토마토 스파게티":{"name":"황금 토마토 스파게티","category":"황금 요리","price":853,"previous_price":518,"updated_at":null},"황금 어니언 링":{"name":"황금 어니언 링","category":"황금 요리","price":987,"previous_price":562,"updated_at":null},"황금 갈릭 케이크":{"name":"황금 갈릭 케이크","category":"황금 요리","price":612,"previous_price":399,"updated_at":null},"황금 삼겹살 토마토 찌개":{"name":"황금 삼겹살 토마토 찌개","category":"황금 요리","price":1951,"previous_price":681,"updated_at":null},"황금 삼색 아이스크림":{"name":"황금 삼색 아이스크림","category":"황금 요리","price":2429,"previous_price":2196,"updated_at":null},"황금 마늘 양갈비 핫도그":{"name":"황금 마늘 양갈비 핫도그","category":"황금 요리","price":1463,"previous_price":1280,"updated_at":null},"황금 달콤 시리얼":{"name":"황금 달콤 시리얼","category":"황금 요리","price":2590,"previous_price":1789,"updated_at":null},"황금 로스트 치킨 파이":{"name":"황금 로스트 치킨 파이","category":"황금 요리","price":1931,"previous_price":1722,"updated_at":null},"황금 스윗 치킨 햄버거":{"name":"황금 스윗 치킨 햄버거","category":"황금 요리","price":2166,"previous_price":2923,"updated_at":null},"황금 토마토 파인애플 피자":{"name":"황금 토마토 파인애플 피자","category":"황금 요리","price":1752,"previous_price":1369,"updated_at":null},"황금 양파 수프":{"name":"황금 양파 수프","category":"황금 요리","price":2363,"previous_price":3209,"updated_at":null},"황금 허브 삼겹살 찜":{"name":"황금 허브 삼겹살 찜","category":"황금 요리","price":1278,"previous_price":2208,"updated_at":null},"황금 토마토 라자냐":{"name":"황금 토마토 라자냐","category":"황금 요리","price":1998,"previous_price":4574,"updated_at":null},"황금 딥 크림 빠네":{"name":"황금 딥 크림 빠네","category":"황금 요리","price":3167,"previous_price":1584,"updated_at":null},"황금 트리플 소갈비 꼬치":{"name":"황금 트리플 소갈비 꼬치","category":"황금 요리","price":3850,"previous_price":2967,"updated_at":null}};
const prices={...initial};
const cfg=window.DDING_SUPABASE_CONFIG||{};
const url=String(cfg.url||'').trim().replace(/\/$/,'');
const key=String(cfg.publishableKey||'').trim();
const configured=/^https:\/\/[^\s/]+$/i.test(url) && key.length>12;
let loaded=false, err='',inFlight=false,lastRead=null;
let db=null;
try{if(configured && window.supabase?.createClient){
  db=window.supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}}catch(e){err=String(e.message||e);}
const fmt=(n)=>Number(n).toLocaleString('ko-KR');
function get(name){return prices[name]||null;}
function getPrice(name){return get(name)?.price??null;}
function change(name){const p=get(name);return p ? p.price-p.previous_price:0;}
function badge(name){const diff=change(name);if(!diff)return '';
 return `<span class="price-change ${diff>0?'price-up':'price-down'}" aria-label="이전 가격 대비 ${diff>0?'상승':'하락'} ${fmt(Math.abs(diff))} 골드">${diff>0?'↑ +':'↓ −'}${fmt(Math.abs(diff))} G</span>`;
}
function applyToWiki(data){if(!data)return;
 for(const [name,p] of Object.entries(prices)){
  const category=data.regular?.[name]?'regular':data.golden?.[name]?'golden':null;
  if(category)data[category][name].price=p.price;
  if(data.items?.[name])data.items[name].price=p.price;
  for(const rec of data.recipesByItem?.[name]||[])if(rec.recipe && rec.recipe.price!==undefined)rec.recipe.price=p.price;
 }
 for(const fac of Object.values(data.facilities||{}))for(const group of fac.groups||[])for(const rec of group.recipes||[]){
  if(prices[rec.name]&&rec.price!==undefined)rec.price=prices[rec.name].price;
 }
}
function publish(){applyToWiki(window.DDING_WIKI_DATA);
 window.dispatchEvent(new CustomEvent('dding-prices-updated',{detail:{loaded,configured,error:err,lastRead}}));
}
async function reload(){if(!db||inFlight)return;inFlight=true;
 try{
  const {data,error}=await db.from('dish_prices').select('name,category,price,previous_price,updated_at');
  if(error)throw error;
  if(!Array.isArray(data)||data.length!==30)throw Error('서버 가격표가 30개가 아닙니다. SQL 초기화를 확인하세요.');
  const names=new Set(data.map(p=>p.name));
  if(Object.keys(initial).some(n=>!names.has(n)))throw Error('가격표에 누락된 요리가 있습니다.');
  let changed=false;
  for(const row of data){
    const name=row.name;
    if(!initial[name]||!Number.isSafeInteger(row.price)||row.price<0||!Number.isSafeInteger(row.previous_price))continue;
    if(prices[name].price!==row.price||prices[name].previous_price!==row.previous_price)changed=true;
    prices[name]={...initial[name],...row};
  }
  loaded=true;err='';lastRead=new Date();
  if(changed||!store._firstReady){store._firstReady=true;publish();}
 }catch(e){err=String(e.message||e);store._firstReady=true;publish();}
 finally{inFlight=false;}
}
const store={prices,initial,configured,get,getPrice,change,badge,applyToWiki,reload,get connected(){return loaded},get error(){return err},get lastRead(){return lastRead}};
window.DDING_DISH_PRICES=store;
applyToWiki(window.DDING_WIKI_DATA);
if(db){void reload();setInterval(()=>{if(!document.hidden)void reload();},60000);
 window.addEventListener('focus',()=>void reload());document.addEventListener('visibilitychange',()=>{if(!document.hidden)void reload();});
}
})();
