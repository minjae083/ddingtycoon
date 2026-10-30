'use strict';

const STORE_KEY = 'dding-simulator-v34-upgrade-facility';
let materialsMode = 'unit';
const STAMINA_BUDGET = 1000;
const $ = id => document.getElementById(id);
const fmt = (num, d = 0) => Number.isFinite(num)
  ? Number(num).toLocaleString('ko-KR', { minimumFractionDigits: d ? 0 : 0, maximumFractionDigits: d })
  : '—';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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

const ITEM_ICONS = {
  '토마토':'🍅','양파':'🧅','마늘':'🧄','파인애플':'🍍','코코넛':'🥥','밀':'🌾','당근':'🥕','감자':'🥔','비트':'🫜','호박':'🎃','수박':'🍉',
  '달콤한 열매':'🍓','사탕수수':'🪴','설탕':'🍬','설탕 큐브':'🍬','소금':'🧂','요리용 소금':'🧂','요리용 달걀':'🥚','요리용 우유':'🥛','오일':'🫙',
  '치즈 조각':'🧀','밀가루 반죽':'🥣','버터 조각':'🧈','양파 베이스':'🧅','토마토 베이스':'🍅','마늘 베이스':'🧄',
  '당근 묶음':'🥕','감자 묶음':'🥔','비트 묶음':'🫜','호박 묶음':'🎃','수박 묶음':'🍉','달콤한 열매 묶음':'🍓',
  '토마토 씨앗':'🌱','양파 씨앗':'🌱','마늘 씨앗':'🌱','코룸':'🪨','리프톤':'💠','세렌트':'🔷','코룸 주괴':'🟫','리프톤 주괴':'🟪','세렌트 주괴':'🟦','조약돌':'🪨','심층암 조약돌':'⬛','구리 블록':'🟧',
  '레드스톤 블록':'🟥','청금석 블록':'🟦','철 블록':'⬜','금 블록':'🟨','다이아몬드 블록':'🟦','자수정 블록':'🟪','나무 원목':'🪵','석탄':'⚫','석탄 블록':'⬛',
  '스테이크':'🥩','익힌 돼지고기':'🍖','익힌 돼지 삼겹살':'🥓','익힌 돼지 앞다리살':'🍖','익힌 닭고기':'🍗','익힌 닭 다리살':'🍗','익힌 닭 가슴살':'🍗',
  '익힌 양고기':'🍖','익힌 양 갈비살':'🍖','익힌 양 다리살':'🍖','익힌 소 등심':'🥩','익힌 소 갈비살':'🥩','금 가루':'✨','식용 금 가루':'🧪',
  '황금 토마토 스파게티':'✨','황금 어니언 링':'✨','황금 갈릭 케이크':'✨','황금 삼겹살 토마토 찌개':'✨','황금 삼색 아이스크림':'✨','황금 마늘 양갈비 핫도그':'✨','황금 달콤 시리얼':'✨','황금 로스트 치킨 파이':'✨','황금 스윗 치킨 햄버거':'✨','황금 토마토 파인애플 피자':'✨','황금 양파 수프':'✨','황금 허브 삼겹살 찜':'✨','황금 토마토 라자냐':'✨','황금 딥 크림 빠네':'✨','황금 트리플 소갈비 꼬치':'✨'
};

const HARVEST_CONFIG = {
  '세이지 괭이': { stamina: 5, drops: 3 },
  '세이지 곡괭이': { stamina: 10, drops: 4 },
};

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

const USER_SHOP = {
  '코룸': { rank: '광물', price: 0 },
  '코룸 주괴': { rank: '가공 광물', price: 8000 },
  '리프톤': { rank: '광물', price: 0 },
  '리프톤 주괴': { rank: '가공 광물', price: 8900 },
  '세렌트': { rank: '광물', price: 0 },
  '세렌트 주괴': { rank: '가공 광물', price: 7465 },
  '어빌리티 스톤': { rank: '강화석', price: 25400 },
  '하급 라이프스톤': { rank: '강화석', price: 14800 },
  '중급 라이프스톤': { rank: '강화석', price: 42000 },
  '상급 라이프스톤': { rank: '강화석', price: 81900 },
};

const SALE_ITEMS = {};
for (const [name, data] of Object.entries(REGULAR_COOKING)) SALE_ITEMS[name] = { category: '요리', price: data.price, rank: data.rank };
for (const [name, data] of Object.entries(GOLDEN_COOKING)) SALE_ITEMS[name] = { category: '황금 요리', price: data.price, rank: data.rank };
for (const [name, data] of Object.entries(USER_SHOP)) SALE_ITEMS[name] = { category: '유저상점', price: data.price, rank: data.rank };

const RECIPES = { ...BASE_RECIPES };
for (const [name, data] of Object.entries(REGULAR_COOKING)) RECIPES[name] = { output: 1, inputs: data.recipe };
// 황금 요리는 제작법 자체가 여러 개를 한 번에 만드는 레시피입니다.
// 원래의 소수 금 가루 환산식 대신 실제 제작 1회의 정수 수량을 사용합니다.
function bulkOutput(name) { return Math.round(1 / GOLDEN_COOKING[name].powderPerItem); }
function goldMode() { return ['bulk','single','best'].includes(state.goldRecipeMode) ? state.goldRecipeMode : 'best'; }
function goldSingleBaseQty(name) { return GOLDEN_COOKING[name].rank.startsWith('레어') ? 2 : 1; }
function goldPowderStamina() { return Number(state.goldPowderHarvests || 0) * Number(state.stamina['세이지 괭이'] || 0); }
function edibleGoldPowderStamina() { return goldPowderStamina() / 10; }
function goldenCraftOutput(name, mode = getGoldenModeForItem(name)) { return mode === 'bulk' ? bulkOutput(name) : 1; }
function getGoldenRecipe(name, mode = getGoldenModeForItem(name)) {
  const data = GOLDEN_COOKING[name];
  return mode === 'bulk'
    ? { output: bulkOutput(name), inputs: { [data.base]: bulkOutput(name), '금 가루': 1 } }
    : { output: 1, inputs: { [data.base]: goldSingleBaseQty(name), '식용 금 가루': 1 } };
}
function syncGoldenRecipes() { /* golden recipes are resolved dynamically in v28 */ }

let state = {
  prices: {},
  stamina: { '세이지 괭이': 5, '세이지 곡괭이': 10 },
  drops: { '세이지 괭이': 3, '세이지 곡괭이': 4 },
  extraPrices: {},
  query: '',
  filter: '전체',
  method: 'expected',
  goldPowderHarvests: 33.33,
  goldRecipeMode: 'best',
};

try {
  const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  state = { ...state, ...stored, prices: { ...state.prices, ...(stored.prices || {}) }, stamina: { ...state.stamina, ...(stored.stamina || {}) }, drops: { ...state.drops, ...(stored.drops || {}) }, extraPrices: { ...state.extraPrices, ...(stored.extraPrices || {}) } };
} catch (e) {}
syncGoldenRecipes();

function remember(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch(e) {} }

function resolveRecipeCostObject(recipe, qty = recipe.output, stack = []){
  let result = { gold: 0, stamina: 0, materials: {} };
  for (const [inputName, inputQty] of Object.entries(recipe.inputs)) {
    result = mergeCost(result, resolveCost(inputName, (inputQty / recipe.output) * qty, stack));
  }
  return result;
}

function evaluateGoldenMode(name, mode){
  const recipe = getGoldenRecipe(name, mode);
  const outputPerCraft = recipe.output;
  const batchCost = resolveRecipeCostObject(recipe, outputPerCraft, [name]);
  const sale = getSalePrice(name);
  let opportunityPerBatch = 0;
  if (state.method === 'opportunity') {
    for (const [matName, count] of Object.entries(batchCost.materials)) {
      const ref = getReferencePrice(matName);
      if (ref !== null) opportunityPerBatch += ref * count;
    }
  }
  const validStamina = Number.isFinite(batchCost.stamina) && batchCost.stamina > 0;
  const unitProfit = validStamina ? sale - (batchCost.gold + opportunityPerBatch) / outputPerCraft : NaN;
  const batches = validStamina ? Math.floor(STAMINA_BUDGET / batchCost.stamina + 1e-9) : null;
  const craftable = batches === null ? null : batches * outputPerCraft;
  const totalSales = craftable === null ? null : sale * craftable;
  const totalCosts = batches === null ? null : (batchCost.gold + opportunityPerBatch) * batches;
  const efficiency = craftable === null ? null : totalSales - totalCosts;
  return { recipe, outputPerCraft, batchCost, opportunityPerBatch, validStamina, unitProfit, batches, craftable, totalSales, totalCosts, efficiency, mode };
}

function getGoldenModeForItem(name){
  const selected = goldMode();
  if (selected === 'bulk' || selected === 'single') return selected;
  const bulk = evaluateGoldenMode(name, 'bulk');
  const single = evaluateGoldenMode(name, 'single');
  if (Number.isFinite(single.efficiency) && (!Number.isFinite(bulk.efficiency) || single.efficiency > bulk.efficiency)) return 'single';
  return 'bulk';
}

function goldenModeLabel(mode){
  return mode === 'single' ? '개별 제작' : '대량 제작';
}
function getSalePrice(name){
  if (DISH_NAMES.has(name)) return window.DDING_DISH_PRICES?.getPrice(name) ?? SALE_ITEMS[name].price;
  return state.prices[name] !== undefined && state.prices[name] !== '' ? Number(state.prices[name]) : SALE_ITEMS[name].price;
}
function getReferencePrice(name){
  if (state.extraPrices[name] !== undefined && state.extraPrices[name] !== '') return Number(state.extraPrices[name]);
  if (REFERENCE_PRICES[name] !== undefined) return REFERENCE_PRICES[name];
  return null;
}

const DISH_NAMES = new Set([...Object.keys(REGULAR_COOKING), ...Object.keys(GOLDEN_COOKING)]);
const INGREDIENT_ICON_NAMES = new Set(['당근 묶음','감자 묶음','비트 묶음','호박 묶음','수박 묶음','달콤한 열매 묶음','양파 베이스','토마토 베이스','마늘 베이스','설탕 큐브','요리용 소금','치즈 조각','밀가루 반죽','버터 조각','금 가루','식용 금 가루']);
const ENHANCE_ICON_NAMES = new Set(['코룸 주괴','리프톤 주괴','세렌트 주괴','조약돌 뭉치','심층암 조약돌 뭉치','어빌리티 스톤','하급 라이프스톤','중급 라이프스톤','상급 라이프스톤']);
function imagePathForName(name){
  const file = encodeURIComponent(name.replaceAll(' ','_'));
  if (DISH_NAMES.has(name)) return `assets/dishes/${file}.png?v=wiki2`;
  if (INGREDIENT_ICON_NAMES.has(name)) return `assets/ingredients/${file}.png?v=wiki2`;
  if (ENHANCE_ICON_NAMES.has(name)) return `assets/enhance/${file}.png?v=wiki2`;
  return `assets/raw/${file}.png?v=wiki2`;
}
function chipIcon(name){
  const path = imagePathForName(name);
  const fileName = decodeURIComponent(path.split('/').pop().split('?')[0]);
  const rawFile = fileName.replaceAll('_',' ');
  const knownRaw = ['토마토.png','양파.png','마늘.png','파인애플.png','코코넛.png','밀.png','당근.png','감자.png','비트.png','호박.png','수박.png','달콤한 열매.png','사탕수수.png','소금.png','오일.png','요리용 달걀.png','요리용 우유.png','구리 블록.png','철 블록.png','다이아몬드 블록.png','금 블록.png','자수정 블록.png','청금석 블록.png','레드스톤 블록.png','조약돌.png','심층암 조약돌.png','코룸.png','리프톤.png','세렌트.png','강화 횃불.png','익힌 돼지고기.png','익힌 돼지 삼겹살.png','익힌 양고기.png','익힌 양 갈비살.png','익힌 닭고기.png','익힌 닭 다리살.png','익힌 닭 가슴살.png','스테이크.png','익힌 소 등심.png','익힌 돼지 앞다리살.png','익힌 양 다리살.png','익힌 소 갈비살.png'];
  if (DISH_NAMES.has(name) || INGREDIENT_ICON_NAMES.has(name) || ENHANCE_ICON_NAMES.has(name) || knownRaw.includes(rawFile)) {
    return `<img class="calc-icon-img" src="${path}" alt="" loading="lazy">`;
  }
  return ITEM_ICONS[name] || '📦';
}


function createSettingsTables(){
  $('stamina-table').innerHTML = Object.keys(HARVEST_CONFIG).map(name => `
    <tr>
      <td>${esc(name)}</td>
      <td><input type="number" min="0.1" step="0.1" data-kind="stamina" data-name="${esc(name)}" value="${state.stamina[name]}"></td>
      <td><input type="number" min="0.1" step="0.1" data-kind="drops" data-name="${esc(name)}" value="${state.drops[name]}"></td>
    </tr>`).join('');

  $('gold-setting-table').innerHTML = `
    <tr><td>황금 요리 효율 계산 방식</td><td><select data-kind="goldMode" data-name="goldRecipeMode"><option value="best" ${goldMode()==='best'?'selected':''}>자동 최적 선택 (권장)</option><option value="bulk" ${goldMode()==='bulk'?'selected':''}>금 가루 · 대량 제작</option><option value="single" ${goldMode()==='single'?'selected':''}>식용 금 가루 · 개별 제작</option></select></td></tr>
    <tr><td>금 가루 1개 평균 수확 횟수</td><td><input type="number" min="0.1" step="0.01" data-kind="special" data-name="goldPowderHarvests" value="${state.goldPowderHarvests}"><div class="mini-note" style="display:block;margin-top:6px">식용 금 가루는 별도 입력 없이 자동 계산됩니다.</div></td></tr>
    <tr><td>식용 금 가루 환산</td><td><b>금 가루 1개 = 식용 금 가루 10개</b><div class="mini-note" style="display:block;margin-top:6px">현재 설정 기준 식용 금 가루 1개 필요 ST: ${fmt(edibleGoldPowderStamina(),2)} ST</div></td></tr>`;

  const renderPriceTable = (names, bodyId) => {
    $(bodyId).innerHTML = names.map(name => `
      <tr>
        <td><span class="item-mini-icon">${chipIcon(name)}</span><b>${esc(name)}</b></td>
        <td>${fmt(SALE_ITEMS[name].price)} G</td>
        <td>${DISH_NAMES.has(name) ? `<strong>${fmt(getSalePrice(name))} G</strong><div class="mini-note">서버 공용 시세 · 관리자 페이지에서 변경</div>` : `<input type="number" min="0" step="1" data-kind="prices" data-name="${esc(name)}" value="${getSalePrice(name)}">`}</td>
      </tr>`).join('');
  };

  renderPriceTable(Object.keys(REGULAR_COOKING), 'cooking-price-table');
  renderPriceTable(Object.keys(GOLDEN_COOKING), 'golden-price-table');
  renderPriceTable(Object.keys(USER_SHOP), 'user-price-table');

  $('ingredient-table').innerHTML = Object.entries(PURCHASE_PRICES).map(([name, price]) => `<tr><td>${esc(name)}</td><td>${fmt(price)} G</td></tr>`).join('');

  $('extra-price-table').innerHTML = EXTRA_PRICE_INPUTS.map(name => `
    <tr>
      <td>${esc(name)} <span class="mini-note">${REFERENCE_PRICES[name] !== undefined ? `기본 ${fmt(REFERENCE_PRICES[name])} G` : '직접 입력'}</span></td>
      <td><input type="number" min="0" step="0.1" data-kind="extraPrices" data-name="${esc(name)}" value="${state.extraPrices[name] ?? (REFERENCE_PRICES[name] ?? '')}"></td>
    </tr>`).join('');
}

function mergeCost(a, b){
  const result = { gold: (a.gold ?? 0) + (b.gold ?? 0), stamina: (a.stamina ?? 0) + (b.stamina ?? 0), materials: { ...(a.materials || {}) } };
  for (const [k,v] of Object.entries(b.materials || {})) result.materials[k] = (result.materials[k] || 0) + v;
  return result;
}

function resolveCost(name, qty = 1, stack = []){
  if (qty === 0) return { gold: 0, stamina: 0, materials: {} };
  if (name === '스테미나') return { gold: 0, stamina: qty, materials: {} };
  if (PURCHASE_PRICES[name] !== undefined) return { gold: PURCHASE_PRICES[name] * qty, stamina: 0, materials: {} };
  if (name === '금 가루') return { gold: 0, stamina: goldPowderStamina() * qty, materials: {} };
  if (name === '식용 금 가루') return { gold: 0, stamina: edibleGoldPowderStamina() * qty, materials: {} };

  if (GOLDEN_COOKING[name]) {
    const recipe = getGoldenRecipe(name);
    return resolveRecipeCostObject(recipe, qty, [...stack, name]);
  }

  if (state.method === 'buy') {
    const ref = getReferencePrice(name);
    if (ref !== null) return { gold: ref * qty, stamina: 0, materials: {} };
  }

  const recipe = RECIPES[name];
  if (!recipe) return { gold: 0, stamina: 0, materials: { [name]: qty } };
  if (stack.includes(name)) throw new Error('순환 레시피');

  if (recipe.category && HARVEST_CONFIG[recipe.category]) {
    const st = Number(state.stamina[recipe.category]);
    const dr = Number(state.drops[recipe.category]);
    return { gold: 0, stamina: (st / dr) * qty, materials: {} };
  }

  let result = { gold: 0, stamina: 0, materials: {} };
  for (const [inputName, inputQty] of Object.entries(recipe.inputs)) {
    result = mergeCost(result, resolveCost(inputName, (inputQty / recipe.output) * qty, [...stack, name]));
  }
  return result;
}

function collectBaseMaterials(name, qty = 1, stack = []){
  if (qty === 0) return {};
  if (PURCHASE_PRICES[name] !== undefined) return { [name]: qty };
  if (name === '금 가루') return { '금 가루': qty };
  if (name === '식용 금 가루') return { '식용 금 가루': qty };
  if (GOLDEN_COOKING[name]) {
    const recipe = getGoldenRecipe(name);
    let out = {};
    for (const [inputName, inputQty] of Object.entries(recipe.inputs)) {
      const sub = collectBaseMaterials(inputName, (inputQty / recipe.output) * qty, [...stack, name]);
      for (const [k,v] of Object.entries(sub)) out[k] = (out[k] || 0) + v;
    }
    return out;
  }
  // 재료 화면에는 원광이 아닌 주괴 단위로 표시. 채굴 ST 계산은 아래 제작식(원광 16개/주괴) 사용.
  if (stack.length > 0 && ['코룸 주괴','리프톤 주괴','세렌트 주괴'].includes(name)) return { [name]: qty };
  if (stack.includes(name)) return { [name]: qty };
  const recipe = RECIPES[name];
  if (!recipe) return { [name]: qty };
  if (recipe.category && HARVEST_CONFIG[recipe.category]) return { [name]: qty };
  let out = {};
  for (const [inputName, inputQty] of Object.entries(recipe.inputs)) {
    const sub = collectBaseMaterials(inputName, (inputQty / recipe.output) * qty, [...stack, name]);
    for (const [k,v] of Object.entries(sub)) out[k] = (out[k] || 0) + v;
  }
  return out;
}

function sumMaterials(list){
  const out = {};
  for (const item of list) {
    for (const [k,v] of Object.entries(item || {})) out[k] = (out[k] || 0) + v;
  }
  return out;
}

function collectRecipeDisplayMaterials(name, qty = 1){
  if (REGULAR_COOKING[name]) {
    const mats = {};
    for (const [inputName, inputQty] of Object.entries(REGULAR_COOKING[name].recipe)) mats[inputName] = inputQty * qty;
    return mats;
  }
  if (GOLDEN_COOKING[name]) {
    const info = GOLDEN_COOKING[name];
    const mode = getGoldenModeForItem(name);
    if (mode === 'bulk') {
      const batches = Math.ceil(qty / bulkOutput(name) - 1e-9);
      return { [info.base]: batches * bulkOutput(name), '금 가루': batches };
    }
    return { [info.base]: qty * goldSingleBaseQty(name), '식용 금 가루': qty };
  }
  // 상점 강화/광물 제작품은 실제 제작대에 넣는 재료 그대로 보여준다.
  if (USER_SHOP[name] && RECIPES[name] && RECIPES[name].inputs && !RECIPES[name].category) {
    const { output, inputs } = RECIPES[name];
    return Object.fromEntries(Object.entries(inputs).map(([material, amount]) => [material, amount * qty / output]));
  }
  return collectBaseMaterials(name, qty);
}

function computeRows(){
  const rows = [];
  for (const [name, meta] of Object.entries(SALE_ITEMS)) {
    const sale = Number(getSalePrice(name));
    if (!Number.isFinite(sale)) continue;

    let outputPerCraft = 1, batchCost, unitCost, validStamina, unitProfit, batches, craftable, totalSales, totalCosts, efficiency, chosenMode = null;
    if (GOLDEN_COOKING[name]) {
      chosenMode = getGoldenModeForItem(name);
      const goldenEval = evaluateGoldenMode(name, chosenMode);
      outputPerCraft = goldenEval.outputPerCraft;
      batchCost = goldenEval.batchCost;
      validStamina = goldenEval.validStamina;
      unitProfit = goldenEval.unitProfit;
      batches = goldenEval.batches;
      craftable = goldenEval.craftable;
      totalSales = goldenEval.totalSales;
      totalCosts = goldenEval.totalCosts;
      efficiency = goldenEval.efficiency;
      unitCost = {
        gold: batchCost.gold / outputPerCraft,
        stamina: batchCost.stamina / outputPerCraft,
        materials: Object.fromEntries(Object.entries(batchCost.materials).map(([k,v]) => [k,v/outputPerCraft]))
      };
    } else {
      batchCost = resolveCost(name, outputPerCraft);
      unitCost = {
        gold: batchCost.gold / outputPerCraft,
        stamina: batchCost.stamina / outputPerCraft,
        materials: Object.fromEntries(Object.entries(batchCost.materials).map(([k,v]) => [k,v/outputPerCraft]))
      };
      let opportunityPerBatch = 0;
      if (state.method === 'opportunity') {
        for (const [matName, count] of Object.entries(batchCost.materials)) {
          const ref = getReferencePrice(matName);
          if (ref !== null) opportunityPerBatch += ref * count;
        }
      }
      validStamina = Number.isFinite(batchCost.stamina) && batchCost.stamina > 0;
      unitProfit = validStamina ? sale - (batchCost.gold + opportunityPerBatch) / outputPerCraft : NaN;
      batches = validStamina ? Math.floor(STAMINA_BUDGET / batchCost.stamina + 1e-9) : null;
      craftable = batches === null ? null : batches * outputPerCraft;
      totalSales = craftable === null ? null : sale * craftable;
      totalCosts = batches === null ? null : (batchCost.gold + opportunityPerBatch) * batches;
      efficiency = craftable === null ? null : totalSales - totalCosts;
    }
    const baseMaterials = craftable ? collectBaseMaterials(name, craftable) : {};
    const displayMaterials = craftable ? collectRecipeDisplayMaterials(name, craftable) : {};
    rows.push({
      name, category: meta.category, rank: meta.rank, sale,
      unitProfit, unitStamina: unitCost.stamina, efficiency, totalSales,
      totalCosts, craftable, batches, outputPerCraft, baseMaterials, displayMaterials,
      goldenMode: chosenMode
    });
  }
  return rows;
}

// 재료는 실제 인벤토리에 준비할 수 있는 정수 개수로 표시한다.
// 확률/평균 생산량에 의해 소수로 계산된 수량은 모자라지 않게 올림한다.
// 황금 요리의 금 가루는 묶음 제작 시 필요한 총량을 기준으로 올림한다.
let stackView = false;
function formatMaterialQty(n) {
  const count = Math.ceil(n - 1e-9);
  if (!stackView || count < 64) return fmt(count);
  const sets = Math.floor(count / 64), rest = count % 64;
  return fmt(sets) + 'set' + (rest ? ' + ' + fmt(rest) : '');
}
function materialChips(materials){
  const entries = Object.entries(materials).filter(([,v]) => Number.isFinite(v) && v > 0);
  if (!entries.length) return '<span class="muted">재료 없음</span>';
  return entries.map(([name, qty]) => {
    const whole = Math.ceil(qty - 1e-9);
    const isRounded = Math.abs(qty - whole) > 1e-8;
    const note = isRounded ? ` (평균 환산 ${fmt(qty,2)}개 → 준비 ${whole}개)` : '';
    return `
    <div class="mat-chip" title="${esc(name)} ${fmt(whole)}개${esc(note)}">
      <span class="mat-icon">${chipIcon(name)}</span>
      <span class="mat-name">${esc(name)}</span>
      <span class="mat-qty">${formatMaterialQty(whole)}</span>
    </div>`;
  }).join('');
}

function filteredRows(){
  return computeRows()
    .filter(row => state.filter === '전체' ? true : row.category === state.filter)
    .filter(row => row.name.toLowerCase().includes(String(state.query).toLowerCase()))
    .sort((a,b) => (Number.isFinite(b.efficiency) ? b.efficiency : -Infinity) - (Number.isFinite(a.efficiency) ? a.efficiency : -Infinity));
}

function renderResults(){
  const rows = filteredRows();
  $('materials-heading').textContent = materialsMode === 'unit' ? '재료 개수 · 제작 1회' : '재료 개수 · 1,000 ST 제작';
  $('result-table').innerHTML = rows.map((row, idx) => `
    <tr data-item="${esc(row.name)}">
      <td>
        <div class="item-cell">
          <span class="item-rank-num">${idx+1}.</span>
          <div class="item-icon">${chipIcon(row.name)}</div>
          <div class="item-meta">
            <b class="item-name">${esc(row.name)}</b>
            <div class="subline"><span class="pill ${row.category === '황금 요리' ? 'gold' : row.category === '유저상점' ? 'green' : 'blue'}">${esc(row.category)}</span>${row.outputPerCraft > 1 ? `<span class="cell-calc">${row.category === '황금 요리' ? `자동 기준: ${goldenModeLabel(row.goldenMode)} · ` : ''}한 번에 ${row.outputPerCraft}개 제작</span>` : (row.category === '황금 요리' ? `<span class="cell-calc">자동 기준: ${goldenModeLabel(row.goldenMode)}</span>` : '')}</div>
          </div>
        </div>
      </td>
      <td class="num"><span class="metric-value">${fmt(row.sale)} G</span>${window.DDING_DISH_PRICES?.badge(row.name)||''}</td>
      <td class="num ${row.unitProfit >= 0 ? '' : 'minus'}"><span class="metric-value">${fmt(row.unitProfit,2)} G</span></td>
      <td class="num emphasis" title="판매가 × 제작 가능 정수 개수 − 확인된 재료비 × 제작 개수"><span class="metric-value">${Number.isFinite(row.efficiency) ? fmt(row.efficiency,2) + ' G' : '—'}<span class="cell-calc">판매 ${fmt(row.totalSales)}G − 비용 ${fmt(row.totalCosts,2)}G</span></span></td>
      <td class="num"><span class="metric-value">${row.craftable ?? '—'}개</span></td>
      <td><div class="materials-wrap">${materialChips(materialsMode === 'unit' ? collectRecipeDisplayMaterials(row.name, row.outputPerCraft) : row.displayMaterials)}</div></td>
    </tr>`).join('') || '<tr><td colspan="6">표시할 아이템이 없습니다.</td></tr>';

  const best = rows.find(r => Number.isFinite(r.efficiency));
  $('best-name').textContent = best ? best.name : '—';
  $('best-profit').textContent = best && Number.isFinite(best.efficiency) ? `${fmt(best.efficiency,2)} G` : '—';
  $('row-count').textContent = `${rows.length}개 아이템`;
}

function renderQuick(){
  const name = $('quick-item').value;
  if (!name) { $('quick-view').innerHTML = '아이템을 선택하면 여기서 요약을 보여줍니다.'; return; }
  const row = computeRows().find(r => r.name === name);
  if (!row) return;
  $('quick-price').value = getSalePrice(name);
  $('quick-price').readOnly = DISH_NAMES.has(name);
  $('quick-price').title = DISH_NAMES.has(name) ? '요리 판매가는 관리자만 수정할 수 있습니다.' : '이 기기에서만 가격 조정';
  const mats = materialChips(row.displayMaterials);
  $('quick-view').innerHTML = `
    <div class="quick-grid">
      <div class="quick-card"><small>판매가</small><strong>${fmt(row.sale)} G</strong></div>
      <div class="quick-card"><small>1개 순수익</small><strong>${fmt(row.unitProfit,2)} G</strong></div>
      <div class="quick-card"><small>1,000 ST 실제 제작 개수 기준 순수익</small><strong>${Number.isFinite(row.efficiency) ? fmt(row.efficiency,2) + ' G' : '획득 ST 설정 필요'}</strong><span class="cell-calc">판매 ${fmt(row.totalSales)}G − 비용 ${fmt(row.totalCosts,2)}G${row.category === '황금 요리' ? ` · ${goldenModeLabel(row.goldenMode)} 기준 · 식용 금 가루는 금 가루 ÷ 10 환산` : ''}</span></div>
      <div class="quick-card"><small>1,000 ST 제작 가능</small><strong>${row.craftable ?? '—'}개</strong></div>
    </div>
    <div class="quick-material-box"><div class="quick-title">1,000 ST 기준 필요한 재료</div><div class="materials-wrap">${mats}</div></div>`;
}

function initQuick(){
  const groups = {'요리':[],'황금 요리':[],'유저상점':[]};
  Object.entries(SALE_ITEMS).forEach(([name,meta]) => groups[meta.category].push(name));
  $('quick-item').innerHTML = '<option value="">아이템 선택</option>' + Object.entries(groups).map(([g, list]) => `<optgroup label="${g}">${list.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}</optgroup>`).join('');
  $('quick-item').addEventListener('change', renderQuick);
  $('quick-price').addEventListener('input', () => {
    const name = $('quick-item').value;
    if (!name || DISH_NAMES.has(name)) return;
    state.prices[name] = Number($('quick-price').value || 0);
    remember();
    syncAllPriceInputs(name, state.prices[name]);
    renderQuick();
    renderResults();
    renderPlanner();
  });
}

function syncAllPriceInputs(targetName, value){
  document.querySelectorAll(`input[data-kind="prices"][data-name="${CSS.escape(targetName)}"]`).forEach(el => el.value = value);
}

function bindEvents(){
  $('search').addEventListener('input', e => { state.query = e.target.value; $('header-search').value = e.target.value; remember(); renderResults(); });
  $('header-search').addEventListener('input', e => { state.query = e.target.value; $('search').value = e.target.value; remember(); renderResults(); });
  $('header-search').addEventListener('keydown', e => { if(e.key === 'Enter'){ document.getElementById('table').scrollIntoView({behavior:'smooth'}); } });
  $('filter').addEventListener('change', e => { state.filter = e.target.value; remember(); renderResults(); });
  $('method').addEventListener('change', e => { state.method = e.target.value; remember(); renderResults(); renderQuick(); });
  $('result-table').addEventListener('click', e => {
    const tr = e.target.closest('tr[data-item]');
    if (!tr) return;
    $('quick-item').value = tr.dataset.item;
    renderQuick();
    document.querySelector('.quick-box').scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('settings').addEventListener('input', e => {
    const el = e.target;
    const kind = el.dataset.kind;
    const name = el.dataset.name;
    if (!kind) return;
    if (kind === 'prices' && !DISH_NAMES.has(name)) { state.prices[name] = Number(el.value || 0); syncAllPriceInputs(name, state.prices[name]); }
    if (kind === 'stamina') state.stamina[name] = Number(el.value || 0);
    if (kind === 'drops') state.drops[name] = Number(el.value || 0);
    if (kind === 'special') {
      if (name === 'goldPowderHarvests') state.goldPowderHarvests = Number(el.value || 0);
    }
    if (kind === 'goldMode') { state.goldRecipeMode = el.value; syncGoldenRecipes(); }
    if (kind === 'extraPrices') state.extraPrices[name] = el.value === '' ? '' : Number(el.value);
    if (kind === 'stamina' || (kind === 'special' && name === 'goldPowderHarvests')) createSettingsTables();
    remember(); renderResults(); renderQuick(); renderPlanner();
  });
  ['unit','thousand'].forEach(mode => $('mode-'+mode).addEventListener('click', () => { materialsMode = mode; document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active',btn.dataset.mode === mode)); renderResults(); }));
  $('stack-toggle').addEventListener('click', () => {
    stackView = !stackView;
    const btn = $('stack-toggle');
    btn.classList.toggle('active', stackView);
    btn.setAttribute('aria-pressed', String(stackView));
    btn.textContent = stackView ? '64묶음 ON' : '+64 묶음 보기';
    renderResults(); renderQuick(); renderPlanner();
  });
  $('planner-item').addEventListener('change', renderPlanner);
  $('planner-count').addEventListener('input', renderPlanner);
  document.querySelectorAll('.side-nav a').forEach(link => link.addEventListener('click', () => { document.querySelectorAll('.side-nav a').forEach(a => a.classList.remove('active')); link.classList.add('active'); }));
  $('reset').addEventListener('click', () => {
    if (!confirm('입력한 설정을 초기화할까요?')) return;
    localStorage.removeItem(STORE_KEY); location.reload();
  });
}

function init(){
  createSettingsTables();
  initQuick();
  bindEvents();
  $('search').value = state.query;
  $('header-search').value = state.query;
  $('filter').value = state.filter;
  $('method').value = state.method;
  $('quick-item').value = '토마토 라자냐';
  renderQuick();
  $('planner-item').innerHTML = $('quick-item').innerHTML;
  $('planner-item').value = '토마토 라자냐';
  renderResults();
  renderPlanner();
  window.addEventListener('dding-prices-updated', () => {
    createSettingsTables();renderResults();renderQuick();renderPlanner();
  });
}

function renderPlanner(){
  const name = $('planner-item').value;
  const requested = Math.max(1,Math.floor(Number($('planner-count').value)||1));
  const row = computeRows().find(r => r.name === name);
  if (!row) return;
  const perCraft = row.outputPerCraft || 1;
  const batches = Math.ceil(requested / perCraft);
  const produced = batches * perCraft;
  const totalCost = resolveCost(name, produced);
  let opportunity = 0;
  if (state.method === 'opportunity') {
    for (const [matName, count] of Object.entries(totalCost.materials)) {
      const ref = getReferencePrice(matName);
      if (ref !== null) opportunity += ref * count;
    }
  }
  const expectedProfit = Number.isFinite(totalCost.stamina) ? row.sale*produced-totalCost.gold-opportunity : NaN;
  const mats = collectRecipeDisplayMaterials(name, produced);
  const notice = GOLDEN_COOKING[name]
    ? `<p class="footer-note">황금 요리 계산 기준: ${goldenModeLabel(row.goldenMode)}${perCraft > 1 ? ` · ${fmt(perCraft)}개씩 제작되므로 요청 ${fmt(requested)}개에 대해 ${fmt(produced)}개분 재료를 준비해야 합니다.` : ''}</p>`
    : '';
  $('planner-result').innerHTML = `<div class="planner-stats"><div><span>제작 목표</span><strong>${fmt(requested)}개</strong></div><div><span>실제 완성 수량</span><strong>${fmt(produced)}개</strong></div><div><span>필요 ST</span><strong>${Number.isFinite(totalCost.stamina) ? fmt(totalCost.stamina,2)+' ST' : '식용 금 가루 ST 미설정'}</strong></div><div><span>예상 순수익</span><strong>${Number.isFinite(expectedProfit) ? fmt(expectedProfit,2)+' G' : '—'}</strong></div></div><h4>전체 필요한 제작 재료</h4><div class="materials-wrap">${materialChips(mats)}</div>${notice}<p class="footer-note">우리 모두 모몽가를 좋아해 보는건 어떨까요.</p>`;
}

document.addEventListener('DOMContentLoaded', init);
