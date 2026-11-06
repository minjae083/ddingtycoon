
'use strict';
// Base recipes and prices are extracted unchanged from existing main.js.
const PURCHASE_PRICES = {
  '소금': 2,
  '요리용 달걀': 3,
  '요리용 우유': 3,
  '오일': 4,
};

const REFERENCE_PRICES = {
  '토마토': 7,'양파': 11,'마늘': 7,'파인애플': 1,'코코넛': 1,'밀': 1,'당근': 1,'감자': 1,'비트': 3,'호박': 2,'수박': 2,
  '달콤한 열매': 1,'사탕수수': 1,'나무 원목': 2,'석탄 블록': 40,'레드스톤 블록': 40,'청금석 블록': 40,'철 블록': 100,'금 블록': 150,
  '다이아몬드 블록': 500,'에메랄드 블록': 1000,'네더라이트 블록': 3600,'코룸': 0,'리프톤': 0,'세렌트': 0,
};

const EXTRA_PRICE_INPUTS = [
  '구리 블록','자수정 블록','조약돌','심층암 조약돌','석탄','파인애플','코코넛','토마토','양파','마늘',
  '익힌 돼지고기','익힌 돼지 삼겹살','익힌 돼지 앞다리살','익힌 닭고기','익힌 닭 다리살','익힌 닭 가슴살',
  '익힌 양고기','익힌 양 갈비살','익힌 양 다리살','익힌 소 등심','익힌 소 갈비살','스테이크'
];


const BASE_RECIPES = {
  '양파 씨앗': { category: '세이지 괭이', output: 1, inputs: { '스테미나': 5 } },
  '토마토 씨앗': { category: '세이지 괭이', output: 1, inputs: { '스테미나': 5 } },
  '마늘 씨앗': { category: '세이지 괭이', output: 1, inputs: { '스테미나': 5 } },
  '코룸': { category: '세이지 곡괭이', output: 1, inputs: { '스테미나': 10 } },
  '리프톤': { category: '세이지 곡괭이', output: 1, inputs: { '스테미나': 10 } },
  '세렌트': { category: '세이지 곡괭이', output: 1, inputs: { '스테미나': 10 } },

  '양파': { output: 1.5, inputs: { '양파 씨앗': 1 } },
  '토마토': { output: 2, inputs: { '토마토 씨앗': 1 } },
  '마늘': { output: 2.5, inputs: { '마늘 씨앗': 1 } },

  '설탕': { output: 1, inputs: { '사탕수수': 1 } },
  '목탄': { output: 1, inputs: { '나무 원목': 1 } },
  '나무 판자': { output: 4, inputs: { '나무 원목': 1 } },
  '막대기': { output: 4, inputs: { '나무 판자': 2 } },
  '횃불': { output: 4, inputs: { '막대기': 1, '석탄': 1 } },
  '강화 횃불': { output: 1, inputs: { '횃불': 4 } },

  '당근 묶음': { output: 1, inputs: { '당근': 64 } },
  '감자 묶음': { output: 1, inputs: { '감자': 64 } },
  '비트 묶음': { output: 1, inputs: { '비트': 64 } },
  '호박 묶음': { output: 1, inputs: { '호박': 64 } },
  '수박 묶음': { output: 1, inputs: { '수박': 64 } },
  '달콤한 열매 묶음': { output: 1, inputs: { '달콤한 열매': 64 } },
  '설탕 큐브': { output: 1, inputs: { '설탕': 64 } },
  '요리용 소금': { output: 1, inputs: { '소금': 16 } },
  '치즈 조각': { output: 1, inputs: { '요리용 우유': 8, '요리용 소금': 8 } },
  '밀가루 반죽': { output: 1, inputs: { '밀': 16, '요리용 달걀': 4 } },
  '버터 조각': { output: 1, inputs: { '요리용 우유': 8, '소금': 4, '오일': 4 } },
  '양파 베이스': { output: 1, inputs: { '양파': 8 } },
  '토마토 베이스': { output: 1, inputs: { '토마토': 8 } },
  '마늘 베이스': { output: 1, inputs: { '마늘': 8 } },

  '코룸 주괴': { output: 1, inputs: { '코룸': 16, '강화 횃불': 2 } },
  '리프톤 주괴': { output: 1, inputs: { '리프톤': 16, '강화 횃불': 2 } },
  '세렌트 주괴': { output: 1, inputs: { '세렌트': 16, '강화 횃불': 2 } },
  '조약돌 뭉치': { output: 1, inputs: { '조약돌': 64 } },
  '심층암 조약돌 뭉치': { output: 1, inputs: { '심층암 조약돌': 64 } },
  '어빌리티 스톤': { output: 1, inputs: { '코룸 주괴': 1, '리프톤 주괴': 1, '세렌트 주괴': 1 } },
  '하급 라이프스톤': { output: 1, inputs: { '조약돌 뭉치': 2, '구리 블록': 8, '레드스톤 블록': 3, '코룸 주괴': 1 } },
  '중급 라이프스톤': { output: 1, inputs: { '심층암 조약돌 뭉치': 2, '청금석 블록': 5, '철 블록': 5, '다이아몬드 블록': 3, '리프톤 주괴': 2 } },
  '상급 라이프스톤': { output: 1, inputs: { '구리 블록': 30, '자수정 블록': 20, '철 블록': 7, '금 블록': 7, '다이아몬드 블록': 5, '세렌트 주괴': 3 } },
};

const REGULAR_COOKING = {
  '토마토 스파게티': { rank: '커먼', price: 507, recipe: { '토마토 베이스': 1, '호박 묶음': 1 } },
  '어니언 링': { rank: '커먼', price: 587, recipe: { '양파 베이스': 1, '감자 묶음': 1 } },
  '갈릭 케이크': { rank: '커먼', price: 364, recipe: { '마늘 베이스': 1, '당근 묶음': 1 } },
  '삼겹살 토마토 찌개': { rank: '노멀', price: 1160, recipe: { '토마토 베이스': 2, '비트 묶음': 1, '요리용 소금': 1, '익힌 돼지고기': 1, '익힌 돼지 삼겹살': 1 } },
  '삼색 아이스크림': { rank: '노멀', price: 1444, recipe: { '양파 베이스': 2, '수박 묶음': 1, '코코넛': 1, '설탕 큐브': 1, '요리용 우유': 1 } },
  '마늘 양갈비 핫도그': { rank: '노멀', price: 870, recipe: { '마늘 베이스': 1, '감자 묶음': 1, '오일': 1, '익힌 양고기': 1, '익힌 양 갈비살': 1 } },
  '달콤 시리얼': { rank: '노멀', price: 1540, recipe: { '토마토 베이스': 2, '달콤한 열매 묶음': 1, '파인애플': 1, '밀가루 반죽': 1, '오일': 1 } },
  '로스트 치킨 파이': { rank: '노멀', price: 1148, recipe: { '마늘 베이스': 2, '당근 묶음': 1, '버터 조각': 1, '익힌 닭고기': 1, '익힌 닭 다리살': 1 } },
  '스윗 치킨 햄버거': { rank: '레어', price: 1288, recipe: { '토마토 베이스': 1, '양파 베이스': 1, '비트 묶음': 1, '달콤한 열매 묶음': 1, '익힌 닭 가슴살': 1, '익힌 닭 다리살': 1 } },
  '토마토 파인애플 피자': { rank: '레어', price: 1042, recipe: { '토마토 베이스': 2, '마늘 베이스': 1, '파인애플': 1, '치즈 조각': 1, '스테이크': 1, '익힌 소 등심': 1 } },
  '양파 수프': { rank: '레어', price: 1405, recipe: { '양파 베이스': 1, '마늘 베이스': 1, '감자 묶음': 1, '코코넛': 1, '버터 조각': 1, '익힌 돼지 앞다리살': 1 } },
  '허브 삼겹살 찜': { rank: '레어', price: 760, recipe: { '마늘 베이스': 2, '양파 베이스': 1, '호박 묶음': 1, '감자 묶음': 1, '익힌 돼지고기': 1, '익힌 돼지 삼겹살': 1 } },
  '토마토 라자냐': { rank: '에픽', price: 1188, recipe: { '토마토 베이스': 1, '양파 베이스': 1, '마늘 베이스': 1, '당근 묶음': 1, '호박 묶음': 1, '밀가루 반죽': 1, '익힌 양 다리살': 1 } },
  '딥 크림 빠네': { rank: '에픽', price: 1883, recipe: { '토마토 베이스': 1, '양파 베이스': 1, '마늘 베이스': 1, '수박 묶음': 1, '감자 묶음': 1, '치즈 조각': 1, '요리용 우유': 1 } },
  '트리플 소갈비 꼬치': { rank: '에픽', price: 2289, recipe: { '토마토 베이스': 1, '양파 베이스': 1, '마늘 베이스': 1, '당근 묶음': 1, '비트 묶음': 1, '설탕 큐브': 1, '익힌 소 갈비살': 1 } },
};

const GOLDEN_COOKING = {
  '황금 토마토 스파게티': { rank: '레어 황금', price: 853, base: '토마토 스파게티', powderPerItem: 1/20 },
  '황금 어니언 링': { rank: '레어 황금', price: 987, base: '어니언 링', powderPerItem: 1/20 },
  '황금 갈릭 케이크': { rank: '레어 황금', price: 612, base: '갈릭 케이크', powderPerItem: 1/20 },
  '황금 삼겹살 토마토 찌개': { rank: '에픽 황금', price: 1951, base: '삼겹살 토마토 찌개', powderPerItem: 1/13 },
  '황금 삼색 아이스크림': { rank: '에픽 황금', price: 2429, base: '삼색 아이스크림', powderPerItem: 1/13 },
  '황금 마늘 양갈비 핫도그': { rank: '에픽 황금', price: 1463, base: '마늘 양갈비 핫도그', powderPerItem: 1/13 },
  '황금 달콤 시리얼': { rank: '에픽 황금', price: 2590, base: '달콤 시리얼', powderPerItem: 1/13 },
  '황금 로스트 치킨 파이': { rank: '에픽 황금', price: 1931, base: '로스트 치킨 파이', powderPerItem: 1/13 },
  '황금 스윗 치킨 햄버거': { rank: '전설 황금', price: 2166, base: '스윗 치킨 햄버거', powderPerItem: 1/10 },
  '황금 토마토 파인애플 피자': { rank: '전설 황금', price: 1752, base: '토마토 파인애플 피자', powderPerItem: 1/10 },
  '황금 양파 수프': { rank: '전설 황금', price: 2363, base: '양파 수프', powderPerItem: 1/10 },
  '황금 허브 삼겹살 찜': { rank: '전설 황금', price: 1278, base: '허브 삼겹살 찜', powderPerItem: 1/10 },
  '황금 토마토 라자냐': { rank: 'MYTHIC 황금', price: 1998, base: '토마토 라자냐', powderPerItem: 1/10 },
  '황금 딥 크림 빠네': { rank: 'MYTHIC 황금', price: 3167, base: '딥 크림 빠네', powderPerItem: 1/10 },
  '황금 트리플 소갈비 꼬치': { rank: 'MYTHIC 황금', price: 3850, base: '트리플 소갈비 꼬치', powderPerItem: 1/10 },
};


const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:0});
function notifyHeight(){
 const content=document.querySelector('main');
 if(!content||window.parent===window)return;
 // Content height stays accurate even if the parent iframe is taller than its contents.
 const bottom=Math.ceil(content.getBoundingClientRect().bottom+window.scrollY+28);
 try{window.parent.postMessage({type:'dding-efficiency-size',height:Math.max(320,bottom)},location.origin)}catch(_){}
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const server=window.DDING_DISH_PRICES;
let kind='regular',metric='sale',multiplier='unit',sort='desc',level=0,query='';
const queryState=(key,fallback)=>{try{return localStorage.getItem(key)||fallback}catch(_){return fallback}};
level=Math.max(0,Math.min(10,Number(queryState('dding-cooking-skill-preview-level','0'))||0));
$('skillLevel').value=String(level);
function costOf(name,qty=1,visited=new Set()){
 if(PURCHASE_PRICES[name]!==undefined)return PURCHASE_PRICES[name]*qty;
 // Direct reference prices represent an estimated opportunity cost for harvested base materials.
 // They are not shop-verified purchase prices.
 if(REFERENCE_PRICES[name]!==undefined && Number(REFERENCE_PRICES[name])>0)
   return Number(REFERENCE_PRICES[name])*qty;
 if(visited.has(name))return 0;
 const recipe=BASE_RECIPES[name];
 if(!recipe||!recipe.inputs)return 0; // Undefined harvest/market materials are not assigned fictional prices.
 const next=new Set(visited);next.add(name);
 return Object.entries(recipe.inputs).reduce((sum,[ingredient,amount])=>sum+costOf(ingredient,qty*amount/Math.max(.0001,recipe.output||1),next),0);
}
function unitCost(name,category){
 if(category==='regular')return Object.entries(REGULAR_COOKING[name].recipe).reduce((v,[material,count])=>v+costOf(material,count),0);
 return unitCost(GOLDEN_COOKING[name].base,'regular'); // Golden powder has no verified G unit cost.
}
function rows(){
 const data=kind==='regular'?REGULAR_COOKING:GOLDEN_COOKING;
 const count=multiplier==='batch'?(kind==='regular'?50:90):1;
 return Object.entries(data).map(([name,item])=>{
  const base=server?.getPrice(name)??item.price;
  const rate=1+level*.01;
  const sale=Math.round(base*rate),cost=unitCost(name,kind),profit=sale-cost;
  return {name,rank:item.rank,base,sale,cost,profit,count,viewSale:sale*count,viewCost:cost*count,viewProfit:profit*count};
 }).filter(v=>v.name.toLowerCase().includes(query.toLowerCase()))
 .sort((a,b)=>(sort==='asc'?1:-1)*((metric==='sale'?a.viewSale:a.viewProfit)-(metric==='sale'?b.viewSale:b.viewProfit)) || a.name.localeCompare(b.name,'ko'));
}
function render(){
 document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.kind===kind)));
 document.querySelectorAll('[data-metric]').forEach(b=>b.classList.toggle('active',b.dataset.metric===metric));
 $('batchOption').textContent=kind==='regular'?'50개 기준':'90개 기준';
 $('unitName').textContent=multiplier==='unit'?'1개':'선택 기준 수량';
 $('profitHeader').textContent=multiplier==='unit'?'순수익 · 1개':'순수익 · 기준 수량';
 $('saleHeader').textContent=multiplier==='unit'?'판매가 · 1개':'판매가 · 기준 수량';
 $('sortHint').textContent=(metric==='sale'?'판매가':'순수익')+' '+(sort==='asc'?'오름차순':'내림차순');
 const data=rows(),top=data[0];
 $('number').textContent=data.length+'종';
 $('topName').textContent=top?.name||'—';
 $('topValue').textContent=top?fmt(metric==='sale'?top.viewSale:top.viewProfit)+' G':'—';
 $('result').innerHTML=data.map((row,index)=>{
 const img='assets/dishes/'+encodeURIComponent(row.name.replaceAll(' ','_'))+'.png';
 const showSale=row.viewSale,showCost=row.viewCost,showProfit=row.viewProfit;
 const dest='index.html#/facility/'+(kind==='regular'?'cooking':'golden')+'?recipe='+encodeURIComponent(row.name);
 return `<tr><td>${index+1}</td><td><a class="recipe-deeplink" href="${esc(dest)}" target="_top" title="소담 주방의 ${esc(row.name)} 제작법으로 이동"><div class="item"><img loading="lazy" alt="" src="${img}" onerror="this.style.display='none'"><div>${esc(row.name)}<div><small class="tag">${esc(row.rank)}</small></div></div><span class="recipe-go" aria-hidden="true">↗</span></div></a></td><td>${row.count}개</td><td class="value">${fmt(showSale)} G</td><td>${fmt(showCost)} G</td><td class="value ${showProfit>=0?'net':'negative'}">${fmt(showProfit)} G</td></tr>`;
 }).join('')||'<tr><td colspan="6" class="empty">검색 결과가 없습니다.</td></tr>';
 // Notify the existing iframe wrapper when the content height changes.
 notifyHeight();
 requestAnimationFrame(notifyHeight);
}
document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.kind;render()}));
document.querySelectorAll('[data-metric]').forEach(b=>b.addEventListener('click',()=>{metric=b.dataset.metric;render()}));
$('scale').addEventListener('change',e=>{multiplier=e.target.value;render()});
$('sort').addEventListener('change',e=>{sort=e.target.value;render()});
$('search').addEventListener('input',e=>{query=e.target.value.trim();render()});
$('skillLevel').addEventListener('change',e=>{level=Number(e.target.value);try{localStorage.setItem('dding-cooking-skill-preview-level',String(level))}catch(_){}render()});
window.addEventListener('dding-prices-updated',render);
window.addEventListener('resize',render);
if(window.ResizeObserver)new ResizeObserver(notifyHeight).observe(document.querySelector('main'));
window.addEventListener('load',notifyHeight);
// Fonts, images and async prices can change the table height after initial rendering.
if(document.fonts?.ready)document.fonts.ready.then(notifyHeight);
new MutationObserver(()=>requestAnimationFrame(notifyHeight)).observe($('result'),{childList:true,subtree:true});
render();
