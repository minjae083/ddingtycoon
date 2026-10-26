'use strict';

const STORE_KEY = 'dding-simulator-v9-clean-ui';
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
  '익힌 양고기':'🍖','익힌 양 갈비살':'🍖','익힌 양 다리살':'🍖','익힌 소 등심':'🥩','익힌 소 갈비살':'🥩','금 가루':'✨'
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
  '리프톤 주괴': { output: 1, inputs: { '리프톤': 16, '강화 횃불': 4 } },
  '세렌트 주괴': { output: 1, inputs: { '세렌트': 16, '강화 횃불': 8 } },
  '조약돌 뭉치': { output: 1, inputs: { '조약돌': 64 } },
  '심층암 조약돌 뭉치': { output: 1, inputs: { '심층암 조약돌': 64 } },
  '어빌리티 스톤': { output: 1, inputs: { '코룸 주괴': 1, '리프톤 주괴': 1, '세렌트 주괴': 1 } },
  '하급 라이프스톤': { output: 1, inputs: { '조약돌 뭉치': 2, '구리 블록': 8, '레드스톤 블록': 3, '코룸 주괴': 1 } },
  '중급 라이프스톤': { output: 1, inputs: { '심층암 조약돌 뭉치': 2, '청금석 블록': 5, '철 블록': 5, '다이아몬드 블록': 3, '리프톤 주괴': 2 } },
  '상급 라이프스톤': { output: 1, inputs: { '구리 블록': 30, '자수정 블록': 20, '철 블록': 7, '금 블록': 7, '다이아몬드 블록': 5, '세렌트 주괴': 3 } },
};

const REGULAR_COOKING = {
  '토마토 스파게티': { rank: '커먼', price: 332, recipe: { '토마토 베이스': 1, '호박 묶음': 1 } },
  '어니언 링': { rank: '커먼', price: 531, recipe: { '양파 베이스': 1, '감자 묶음': 1 } },
  '갈릭 케이크': { rank: '커먼', price: 243, recipe: { '마늘 베이스': 1, '당근 묶음': 1 } },
  '삼겹살 토마토 찌개': { rank: '노멀', price: 967, recipe: { '토마토 베이스': 2, '비트 묶음': 1, '요리용 소금': 1, '익힌 돼지고기': 1, '익힌 돼지 삼겹살': 1 } },
  '삼색 아이스크림': { rank: '노멀', price: 1363, recipe: { '양파 베이스': 2, '수박 묶음': 1, '코코넛': 1, '설탕 큐브': 1, '요리용 우유': 1 } },
  '마늘 양갈비 핫도그': { rank: '노멀', price: 575, recipe: { '마늘 베이스': 2, '감자 묶음': 1, '오일': 1, '익힌 양고기': 1, '익힌 양 갈비살': 1 } },
  '달콤 시리얼': { rank: '노멀', price: 1325, recipe: { '토마토 베이스': 2, '달콤한 열매 묶음': 1, '파인애플': 1, '밀가루 반죽': 1, '오일': 1 } },
  '로스트 치킨 파이': { rank: '노멀', price: 1240, recipe: { '마늘 베이스': 2, '당근 묶음': 1, '버터 조각': 1, '익힌 닭고기': 1, '익힌 닭 다리살': 1 } },
  '스윗 치킨 햄버거': { rank: '레어', price: 1212, recipe: { '토마토 베이스': 1, '양파 베이스': 1, '비트 묶음': 1, '달콤한 열매 묶음': 1, '익힌 닭 가슴살': 1, '익힌 닭 다리살': 1 } },
  '토마토 파인애플 피자': { rank: '레어', price: 786, recipe: { '토마토 베이스': 2, '마늘 베이스': 1, '파인애플': 1, '치즈 조각': 1, '스테이크': 1, '익힌 소 등심': 1 } },
  '양파 수프': { rank: '레어', price: 1275, recipe: { '양파 베이스': 2, '마늘 베이스': 1, '감자 묶음': 1, '코코넛': 1, '버터 조각': 1, '익힌 돼지 앞다리살': 1 } },
  '허브 삼겹살 찜': { rank: '레어', price: 702, recipe: { '마늘 베이스': 2, '양파 베이스': 1, '호박 묶음': 1, '감자 묶음': 1, '익힌 돼지고기': 1, '익힌 돼지 삼겹살': 1 } },
  '토마토 라자냐': { rank: '에픽', price: 2567, recipe: { '토마토 베이스': 1, '양파 베이스': 1, '마늘 베이스': 1, '당근 묶음': 1, '호박 묶음': 1, '밀가루 반죽': 1, '익힌 양 다리살': 1 } },
  '딥 크림 빠네': { rank: '에픽', price: 949, recipe: { '토마토 베이스': 1, '양파 베이스': 1, '마늘 베이스': 1, '수박 묶음': 1, '감자 묶음': 1, '치즈 조각': 1, '요리용 우유': 1 } },
  '트리플 소갈비 꼬치': { rank: '에픽', price: 2230, recipe: { '토마토 베이스': 1, '양파 베이스': 1, '마늘 베이스': 1, '당근 묶음': 1, '비트 묶음': 1, '설탕 큐브': 1, '익힌 소 갈비살': 1 } },
};

const GOLDEN_COOKING = {
  '황금 토마토 스파게티': { rank: '레어 황금', price: 558, base: '토마토 스파게티', powderPerItem: 1/20 },
  '황금 어니언 링': { rank: '레어 황금', price: 893, base: '어니언 링', powderPerItem: 1/20 },
  '황금 갈릭 케이크': { rank: '레어 황금', price: 409, base: '갈릭 케이크', powderPerItem: 1/20 },
  '황금 삼겹살 토마토 찌개': { rank: '에픽 황금', price: 1626, base: '삼겹살 토마토 찌개', powderPerItem: 1/13 },
  '황금 삼색 아이스크림': { rank: '에픽 황금', price: 2292, base: '삼색 아이스크림', powderPerItem: 1/13 },
  '황금 마늘 양갈비 핫도그': { rank: '에픽 황금', price: 967, base: '마늘 양갈비 핫도그', powderPerItem: 1/13 },
  '황금 달콤 시리얼': { rank: '에픽 황금', price: 2228, base: '달콤 시리얼', powderPerItem: 1/13 },
  '황금 로스트 치킨 파이': { rank: '에픽 황금', price: 2085, base: '로스트 치킨 파이', powderPerItem: 1/13 },
  '황금 스윗 치킨 햄버거': { rank: '전설 황금', price: 2038, base: '스윗 치킨 햄버거', powderPerItem: 1/10 },
  '황금 토마토 파인애플 피자': { rank: '전설 황금', price: 1322, base: '토마토 파인애플 피자', powderPerItem: 1/10 },
  '황금 양파 수프': { rank: '전설 황금', price: 2144, base: '양파 수프', powderPerItem: 1/10 },
  '황금 허브 삼겹살 찜': { rank: '전설 황금', price: 1181, base: '허브 삼겹살 찜', powderPerItem: 1/10 },
  '황금 토마토 라자냐': { rank: '신화 황금', price: 4317, base: '토마토 라자냐', powderPerItem: 1/10 },
  '황금 딥 크림 빠네': { rank: '신화 황금', price: 1596, base: '딥 크림 빠네', powderPerItem: 1/10 },
  '황금 트리플 소갈비 꼬치': { rank: '신화 황금', price: 3750, base: '트리플 소갈비 꼬치', powderPerItem: 1/10 },
};

const USER_SHOP = {
  '코룸': { rank: '광물', price: 0 },
  '코룸 주괴': { rank: '가공 광물', price: 8900 },
  '리프톤': { rank: '광물', price: 0 },
  '리프톤 주괴': { rank: '가공 광물', price: 8900 },
  '세렌트': { rank: '광물', price: 0 },
  '세렌트 주괴': { rank: '가공 광물', price: 8000 },
  '어빌리티 스톤': { rank: '강화석', price: 25000 },
  '하급 라이프스톤': { rank: '강화석', price: 14499 },
  '중급 라이프스톤': { rank: '강화석', price: 44900 },
  '상급 라이프스톤': { rank: '강화석', price: 83000 },
};

const SALE_ITEMS = {};
for (const [name, data] of Object.entries(REGULAR_COOKING)) SALE_ITEMS[name] = { category: '요리', price: data.price, rank: data.rank };
for (const [name, data] of Object.entries(GOLDEN_COOKING)) SALE_ITEMS[name] = { category: '황금 요리', price: data.price, rank: data.rank };
for (const [name, data] of Object.entries(USER_SHOP)) SALE_ITEMS[name] = { category: '유저상점', price: data.price, rank: data.rank };

const RECIPES = { ...BASE_RECIPES };
for (const [name, data] of Object.entries(REGULAR_COOKING)) RECIPES[name] = { output: 1, inputs: data.recipe };
for (const [name, data] of Object.entries(GOLDEN_COOKING)) RECIPES[name] = { output: 1, inputs: { [data.base]: 1, '금 가루': data.powderPerItem } };

let state = {
  prices: {},
  stamina: { '세이지 괭이': 5, '세이지 곡괭이': 10 },
  drops: { '세이지 괭이': 3, '세이지 곡괭이': 4 },
  extraPrices: {},
  query: '',
  filter: '전체',
  method: 'expected',
  goldPowderHarvests: 33.33,
};

try {
  const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  state = { ...state, ...stored, prices: { ...state.prices, ...(stored.prices || {}) }, stamina: { ...state.stamina, ...(stored.stamina || {}) }, drops: { ...state.drops, ...(stored.drops || {}) }, extraPrices: { ...state.extraPrices, ...(stored.extraPrices || {}) } };
} catch (e) {}

function remember(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch(e) {} }
function getSalePrice(name){ return state.prices[name] !== undefined && state.prices[name] !== '' ? Number(state.prices[name]) : SALE_ITEMS[name].price; }
function getReferencePrice(name){
  if (state.extraPrices[name] !== undefined && state.extraPrices[name] !== '') return Number(state.extraPrices[name]);
  if (REFERENCE_PRICES[name] !== undefined) return REFERENCE_PRICES[name];
  return null;
}
function chipIcon(name){ return ITEM_ICONS[name] || '📦'; }

function createSettingsTables(){
  $('stamina-table').innerHTML = Object.keys(HARVEST_CONFIG).map(name => `
    <tr>
      <td>${esc(name)}</td>
      <td><input type="number" min="0.1" step="0.1" data-kind="stamina" data-name="${esc(name)}" value="${state.stamina[name]}"></td>
      <td><input type="number" min="0.1" step="0.1" data-kind="drops" data-name="${esc(name)}" value="${state.drops[name]}"></td>
    </tr>`).join('');

  $('gold-setting-table').innerHTML = `
    <tr><td>금 가루 1개 평균 수확 횟수</td><td><input type="number" min="0.1" step="0.01" data-kind="special" data-name="goldPowderHarvests" value="${state.goldPowderHarvests}"></td></tr>`;

  const renderPriceTable = (names, bodyId) => {
    $(bodyId).innerHTML = names.map(name => `
      <tr>
        <td><span class="item-mini-icon">${chipIcon(name)}</span><b>${esc(name)}</b></td>
        <td>${fmt(SALE_ITEMS[name].price)} G</td>
        <td><input type="number" min="0" step="1" data-kind="prices" data-name="${esc(name)}" value="${getSalePrice(name)}"></td>
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
  const result = { gold: (a.gold || 0) + (b.gold || 0), stamina: (a.stamina || 0) + (b.stamina || 0), materials: { ...(a.materials || {}) } };
  for (const [k,v] of Object.entries(b.materials || {})) result.materials[k] = (result.materials[k] || 0) + v;
  return result;
}

function resolveCost(name, qty = 1, stack = []){
  if (qty === 0) return { gold: 0, stamina: 0, materials: {} };
  if (name === '스테미나') return { gold: 0, stamina: qty, materials: {} };
  if (PURCHASE_PRICES[name] !== undefined) return { gold: PURCHASE_PRICES[name] * qty, stamina: 0, materials: {} };
  if (name === '금 가루') return { gold: 0, stamina: Number(state.goldPowderHarvests || 0) * Number(state.stamina['세이지 괭이']) * qty, materials: {} };

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

function computeRows(){
  const rows = [];
  for (const [name, meta] of Object.entries(SALE_ITEMS)) {
    const sale = Number(getSalePrice(name));
    if (!Number.isFinite(sale)) continue;
    const unitCost = resolveCost(name, 1);
    let opportunity = 0;
    if (state.method === 'opportunity') {
      for (const [matName, count] of Object.entries(unitCost.materials)) {
        const ref = getReferencePrice(matName);
        if (ref !== null) opportunity += ref * count;
      }
    }
    const unitProfit = sale - unitCost.gold - opportunity;
    // 실제로 판매할 수 있는 정수 개수에 대해서만 수익을 계산한다.
    // 황금 요리의 묶음 제작 단위는 기존 계산기의 평균 ST 기준을 유지한다.
    const craftable = unitCost.stamina > 0 ? Math.floor(STAMINA_BUDGET / unitCost.stamina + 1e-9) : null;
    const efficiency = craftable !== null ? unitProfit * craftable : null;
    const totalSales = craftable !== null ? sale * craftable : null;
    const totalCosts = craftable !== null ? (unitCost.gold + opportunity) * craftable : null;
    const baseMaterials = craftable ? collectBaseMaterials(name, craftable) : {};
    rows.push({
      name,
      category: meta.category,
      rank: meta.rank,
      sale,
      unitProfit,
      unitStamina: unitCost.stamina,
      efficiency,
      totalSales,
      totalCosts,
      craftable,
      baseMaterials,
    });
  }
  return rows;
}

// 재료는 실제 인벤토리에 준비할 수 있는 정수 개수로 표시한다.
// 확률/평균 생산량에 의해 소수로 계산된 수량은 모자라지 않게 올림한다.
// 황금 요리의 금 가루는 묶음 제작 시 필요한 총량을 기준으로 올림한다.
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
      <span class="mat-qty">${fmt(whole)}</span>
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
  $('materials-heading').textContent = materialsMode === 'unit' ? '재료 개수 · 1개 제작' : '재료 개수 · 1,000 ST 제작';
  $('result-table').innerHTML = rows.map((row, idx) => `
    <tr data-item="${esc(row.name)}">
      <td>
        <div class="item-cell">
          <div class="item-icon">${chipIcon(row.name)}</div>
          <div>
            <b>${idx+1}. ${esc(row.name)}</b>
            <div class="subline"><span class="pill ${row.category === '황금 요리' ? 'gold' : row.category === '유저상점' ? 'green' : 'blue'}">${esc(row.category)}</span></div>
          </div>
        </div>
      </td>
      <td class="num">${fmt(row.sale)} G</td>
      <td class="num ${row.unitProfit >= 0 ? '' : 'minus'}">${fmt(row.unitProfit,2)} G</td>
      <td class="num emphasis" title="판매가 × 제작 가능 정수 개수 − 확인된 재료비 × 제작 개수">${Number.isFinite(row.efficiency) ? fmt(row.efficiency,2) + ' G' : '—'}<span class="cell-calc">판매 ${fmt(row.totalSales)}G − 비용 ${fmt(row.totalCosts,2)}G</span></td>
      <td class="num">${row.craftable ?? '—'}개</td>
      <td><div class="materials-wrap">${materialChips(materialsMode === 'unit' ? collectBaseMaterials(row.name, 1) : row.baseMaterials)}</div></td>
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
  const mats = materialChips(row.baseMaterials);
  $('quick-view').innerHTML = `
    <div class="quick-grid">
      <div class="quick-card"><small>판매가</small><strong>${fmt(row.sale)} G</strong></div>
      <div class="quick-card"><small>1개 순수익</small><strong>${fmt(row.unitProfit,2)} G</strong></div>
      <div class="quick-card"><small>1,000 ST 실제 제작 개수 기준 순수익</small><strong>${fmt(row.efficiency,2)} G</strong><span class="cell-calc">판매 ${fmt(row.totalSales)}G − 비용 ${fmt(row.totalCosts,2)}G</span></div>
      <div class="quick-card"><small>1,000 ST 제작 가능</small><strong>${row.craftable}개</strong></div>
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
    if (!name) return;
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
    if (kind === 'prices') { state.prices[name] = Number(el.value || 0); syncAllPriceInputs(name, state.prices[name]); }
    if (kind === 'stamina') state.stamina[name] = Number(el.value || 0);
    if (kind === 'drops') state.drops[name] = Number(el.value || 0);
    if (kind === 'special') state.goldPowderHarvests = Number(el.value || 0);
    if (kind === 'extraPrices') state.extraPrices[name] = el.value === '' ? '' : Number(el.value);
    remember(); renderResults(); renderQuick(); renderPlanner();
  });
  ['unit','thousand'].forEach(mode => $('mode-'+mode).addEventListener('click', () => { materialsMode = mode; document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active',btn.dataset.mode === mode)); renderResults(); }));
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
}

function renderPlanner(){
 const name=$('planner-item').value; const count=Math.max(1,Math.floor(Number($('planner-count').value)||1));
 const row=computeRows().find(r=>r.name===name);if(!row)return;
 const mats=collectBaseMaterials(name,count);
 $('planner-result').innerHTML=`<div class="planner-stats"><div><span>제작 목표</span><strong>${fmt(count)}개</strong></div><div><span>평균 필요 ST</span><strong>${fmt(row.unitStamina*count,2)} ST</strong></div><div><span>예상 순수익</span><strong>${fmt(row.unitProfit*count,2)} G</strong></div></div><h4>전체 필요한 원재료</h4><div class="materials-wrap">${materialChips(mats)}</div><p class="footer-note">평균 확률과 기존 제작식을 이용한 이론적 환산이며 실제 채집 횟수와 다를 수 있습니다.</p>`;
}

document.addEventListener('DOMContentLoaded', init);
