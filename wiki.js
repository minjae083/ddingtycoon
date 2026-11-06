'use strict';
(() => {
  const D = window.DDING_WIKI_DATA;
  const P = window.DDING_DISH_PRICES;
  const app = document.getElementById('app');
  const nav = document.getElementById('sideNavigation');
  const search = document.getElementById('globalSearch');
  const searchResults = document.getElementById('searchResults');
  const tip = document.getElementById('hoverTooltip');
  const headerLogin = document.getElementById('headerLogin');
  let focusLoginOnLoad = false;
  function focusAccountLogin(){
    const frame=document.getElementById('expertsFrame');
    if(!frame)return;
    frame.scrollIntoView({behavior:'smooth',block:'start'});
    try{frame.contentWindow.postMessage({type:'dding-focus-login'},location.origin);}catch(_){}
  }
  // 로그인 / 회원가입 버튼은 공용 계정 창(site-auth.js)이 처리합니다.

  const icons = {
    home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
    diamond:'<path d="M6 4h12l4 6-10 11L2 10z"/><path d="M2 10h20M6 4l6 17L18 4"/>',
    utensils:'<path d="M4 3v8c0 2 4 2 4 0V3M6 3v18M14 3c-2 2-2 6-2 9h5V3M17 12v9"/>',
    pickaxe:'<path d="m4 21 13-13"/><path d="M12 3c5-2 9 0 10 3-5-1-8 1-10 4"/><path d="m7 9 4 4"/>',
    sprout:'<path d="M12 22v-9M12 13c-8 0-9-4-9-9 6 0 10 2 9 9zm0 4c0-7 4-10 9-10 0 6-2 10-9 10z"/>',
    skills:'<path d="M12 3l7 5v8l-7 5-7-5V8z"/><path d="M12 8v8m-4-4h8"/>',
    upgrade:'<path d="M12 22V7m-5 5 5-5 5 5"/><path d="M4 15V4h16v11"/><path d="M7 19h10"/>',
    chart:'<path d="M3 20h18M6 17v-5M11 17V7M16 17v-8"/>',
    flower:'<path d="M12 21v-8m0 4c-2-3-5-3-7-2 1 3 4 5 7 5m0-6c1-3 4-4 7-3-.3 3-3 5-7 6"/><circle cx="12" cy="8" r="2"/><path d="M12 6C7 0 5 7 10 8c-4-5-9 1-4 3 0 5 6 5 6 1 2 5 9 1 6-3 5-2 1-8-4-3"/>',
    coffee:'<path d="M4 7h13v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M3 22h15"/>',
    flame:'<path d="M12 22c4.5 0 7.5-3.1 7.5-7.4 0-3.8-2.1-6.2-5.2-9.6.3 4.5-2.2 5.4-2.4 6.5C10.3 8.2 9 5.2 9.4 2 5.1 6.6 4 10.7 4 14.6 4 18.9 7.3 22 12 22Z"/><path d="M12 21c-1.9 0-3.2-1.4-3.2-3.2 0-1.6 1.1-2.9 2.8-4.5.1 2 1.1 2.8 2.3 3.6 1 2.1.1 4.1-1.9 4.1Z"/>',
    waves:'<path d="M2 7c2 0 2 2 5 2s3-2 5-2 3 2 5 2 3-2 5-2M2 13c2 0 2 2 5 2s3-2 5-2 3 2 5 2 3-2 5-2M2 19c2 0 2 2 5 2s3-2 5-2 3 2 5 2 3-2 5-2"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    book:'<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6m0-9v.5"/>',
    left:'<path d="m15 6-6 6 6 6"/>',
  };
  const iconSvg = (kind) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[kind] || icons.book}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fn = n => Number(n).toLocaleString('ko-KR');
  const itemUrl = name => '#/item/' + encodeURIComponent(name);
  const catUrl = cat => '#/category/' + encodeURIComponent(cat);
  const facilityUrl = fac => '#/facility/' + encodeURIComponent(fac);
  const imageOf = name => D.items[name]?.image || null;
  const getCategory = id => D.categories.find(c => c.id === id);
  const getRecipes = name => D.recipesByItem[name] || [];
  const compared = Object.entries(D.regular).concat(Object.entries(D.golden)).sort((a,b)=>a[0].localeCompare(b[0],'ko'));
  const sortedItemNames = Object.keys(D.items).sort((a,b)=>a.localeCompare(b,'ko'));
  let goldenMode = 'bulk';
  let upgradeSelectedStage = 1;
  let lastRoute = '';
  let lastTipName = '';
  let priceFilter = 'all';
  let pendingPriceRecipe=null; // 요리 시세에서 선택한 제작법 카드
  const priceBadge = name => P?.badge(name) || '';

  // Items without a supplied image use an explicit text fallback; never issue broken image requests.
  function art(name,size='medium') {
    const image=imageOf(name);
    if (image) return `<span class="item-art ${size}" aria-hidden="true"><img loading="lazy" src="${esc(image)}?v=wiki6" alt=""></span>`;
    return `<span class="item-art placeholder ${size}" aria-hidden="true">${esc(name.slice(0,Math.min(3,name.length)))}</span>`;
  }
  function rankClass(rank='') {
    if(rank.includes('MYTHIC') || rank.includes('신화'))return 'rank-mythic';
    if(rank.includes('전설'))return 'rank-legend';
    if(rank.includes('에픽'))return 'rank-epic';
    if(rank.includes('레어'))return 'rank-rare';
    if(rank.includes('노멀'))return 'rank-normal';
    return '';
  }
  function crumb(list) {
    return `<nav class="breadcrumb" aria-label="탐색 경로"><a href="#/">홈</a>${list.map(([label,url])=>`<i>/</i>${url?`<a href="${esc(url)}">${esc(label)}</a>`:`<strong>${esc(label)}</strong>`}`).join('')}</nav>`;
  }
  function field(name, qty, oceanMode=false) {
    const methods=getRecipes(name);
    const hasRecipe=methods.length>0;
    const oceanTarget=oceanMode?methods.find(x=>x.recipe?.oceanId&&x.recipe?.oceanFacility):null;
    const destination=oceanTarget?` data-ocean-target="${esc(oceanTarget.recipe.oceanFacility)}" data-ocean-recipe="${esc(oceanTarget.recipe.oceanId)}"`:'';
    return `<button type="button" class="ingredient-chip" data-ingredient="${esc(name)}" data-quantity="${esc(qty)}"${destination} aria-label="${esc(name)}, ${qty}개. 제작 재료를 확인하려면 선택하세요">${art(name,'small')}<span class="chip-name">${esc(name)}</span>${hasRecipe?'<span class="has-recipe-dot" title="제작법 있음"></span>':''}<span class="chip-qty">×${fn(qty)}</span></button>`;
  }
  function recipeCard(item, fac='') {
    const oceanMode=['alchemy','precision-alchemy','marine'].includes(fac);
    const price=item.price!=null?`<span class="recipe-sub">판매가 ${fn(item.price)} G · 1개 기준 ${priceBadge(item.name)}</span>`:item.method?`<span class="recipe-sub">${item.method==='bulk'?'금 가루 · 대량 제작':'식용 금 가루 · 개별 제작'}</span>`:`<span class="recipe-sub">${item.note||'제작 재료'}</span>`;
    return `<article class="recipe-card ${oceanMode?'ocean-recipe-card':''}" data-method="${esc(item.method||'')}" data-item="${esc(item.name)}" ${item.oceanId?`data-ocean-id="${esc(item.oceanId)}"`:''}>
      <div class="recipe-top">
        <a class="item-button" href="${itemUrl(item.name)}" aria-label="${esc(item.name)} 상세 페이지">${item.variantImage?`<span class="item-art large"><img loading="lazy" src="${esc(item.variantImage)}?v=wiki6" alt=""></span>`:art(item.name,'large')}</a>
        <div class="recipe-intro">
          ${item.rank?`<span class="rank-tag ${rankClass(item.rank)}">${esc(item.rank)}</span>`:item.kind?`<span class="rank-tag">${esc(item.kind)}</span>`:''}
          <h3><a class="recipe-title-link" href="${itemUrl(item.name)}">${esc(item.name)}</a></h3>
          ${price}
        </div>
        <span class="yield">완성 ×${fn(item.output||1)}</span>
      </div>${item.ingredients.length?`<div class="ingredients-grid">${item.ingredients.map(({name,qty})=>field(name,qty,oceanMode)).join('')}</div>`:`<div class="recipe-unregistered">제작법 정보가 아직 등록되지 않았습니다. 아이콘은 제공된 이미지로 표시합니다.</div>`}
      ${oceanMode?`<div class="ocean-recipe-actions"><span>제작 목록 ${fn(oceanQty(item.oceanId))}회</span><button type="button" data-ocean-add="${esc(item.oceanId)}">+ 제작 목록에 담기</button></div>`:''}
    </article>`;
  }
  function groupSection(group, facilityId){
    const gold=facilityId==='golden';
    const shown=gold?group.recipes.filter(r=>r.method===goldenMode):group.recipes;
    const titleCount=gold?group.recipes.length/2:group.recipes.length;
    return `<section class="group-section" id="group-${esc(group.id)}">
      <div class="group-heading">${group.number?`<span class="group-number">${group.number}</span>`:''}<div><h2>${esc(group.title)}</h2><p>${esc(group.description)}</p></div><span class="group-count">${titleCount}개 항목</span></div>
      <div class="recipe-grid">${shown.map(r=>recipeCard(r,facilityId)).join('')}</div>
    </section>`;
  }
  function facilityMetaCount(id){return D.facilities[id]?.groups.reduce((n,g)=>n+(id==='golden'?g.recipes.length/2:g.recipes.length),0)||0;}
  function categoryCards(){
    return D.categories.map(cat=>`<a class="portal-card theme-${esc(cat.theme)}" href="${cat.id==='compare'?'#/compare':catUrl(cat.id)}">
      <div class="portal-top"><span class="portal-icon">${iconSvg(cat.icon)}</span><span class="portal-arrow" aria-hidden="true">↗</span></div>
      <div class="portal-text"><small>${esc(cat.english)}</small><h3>${esc(cat.title)}</h3><p>${esc(cat.description)}</p></div>
      <div class="portal-label">${cat.facilityIds.length?`${cat.facilityIds.length}개 시설`:'판매가 참고'}</div>
    </a>`).join('');
  }
  function renderHome(){
    const total=Object.values(D.facilities).reduce((count,fac)=>count+fac.groups.reduce((s,g)=>s+g.recipes.length,0),0);
    app.innerHTML=`<section class="hero"><div class="hero-text"><span class="eyebrow">SERENITY · ITEM GUIDE</span><h1>띵타이쿤 <span>WIKI</span></h1><p>필요한 아이템의 재료가 궁금할 땐? 제작 시설을 선택하고, 재료에 마우스를 올려 하위 제작법까지 확인해보세요.</p><div class="hero-meta"><span>${D.categories.length}개 카테고리</span><span>${Object.keys(D.facilities).length}개 제작 시설</span><span>${fn(total)}개 제작법</span></div></div></section>
      <div class="section-title"><h2>시설 둘러보기</h2><small>원하는 제작 시설을 선택하세요</small></div>
      <div class="portal-grid">${categoryCards()}</div>
      <div class="home-strip"><div><strong>재료의 제작법도 한 번에</strong><p>재료 칸에 마우스를 올리거나 눌러보세요. 만들 때 필요한 재료를 볼 수 있어요.</p></div><a href="${facilityUrl('enhancement')}">강화 제작 시설 보기 →</a></div>`;
    document.title='띵타이쿤 WIKI | 세레니티 제작 도감';
  }
  function renderCategory(id){
    const cat=getCategory(id);
    if(!cat)return renderNotFound();
    if(cat.id==='compare')return renderCompare();
    const cards=cat.facilityIds.map(fid=>{
      const fac=D.facilities[fid];
      const total=facilityMetaCount(fid);
      return `<a class="facility-card" href="${facilityUrl(fid)}"><div class="facility-card-top">${fac.banner?`<img class="facility-image" src="${esc(fac.banner)}" alt="${esc(fac.title)}">`:`<span class="facility-icon-placeholder">${iconSvg(cat.icon)}</span>`}<span class="facility-arrow">↗</span></div><div><h3>${esc(fac.title)}</h3><p>${esc(fac.description)}</p></div><div class="facility-meta">제작 항목 ${total}개 · 자세히 보기</div></a>`;
    }).join('');
    app.innerHTML=crumb([[cat.title,null]])+`<div class="page-head"><span class="eyebrow">${esc(cat.english)}</span><h1>${esc(cat.title)}</h1><p>${esc(cat.description)}. 원하는 시설을 눌러 제작 레시피를 확인하세요.</p></div><div class="facility-grid">${cards}</div>`;
    document.title=`${cat.title} | 띵타이쿤 WIKI`;
  }
  function renderFacility(id){
    const fac=D.facilities[id];if(!fac)return renderNotFound();
    const cat=getCategory(fac.category);
    const count=facilityMetaCount(id);
    app.innerHTML=crumb([[cat.title,catUrl(cat.id)],[fac.title,null]])+
      `<section class="facility-highlight">${fac.banner?`<img class="facility-image" src="${esc(fac.banner)}" alt="${esc(fac.title)}">`:''}<div><span class="eyebrow">${esc(cat.english)} / CRAFTING</span><h1>${esc(fac.title)}</h1><p>${esc(fac.description)}</p></div><span class="count-pill">${count}개 항목</span></section>
      <nav class="anchor-tabs" aria-label="시설 내 항목 이동">${fac.groups.map(g=>`<a href="#group-${esc(g.id)}" data-scroll-target="group-${esc(g.id)}">${g.number?`${g.number}. `:''}${esc(g.title)}<span class="anchor-count">${id==='golden'?g.recipes.length/2:g.recipes.length}</span></a>`).join('')}</nav>
      ${id==='golden'?`<div class="method-tabs" role="group" aria-label="황금 요리 제작 방식"><button class="method-btn ${goldenMode==='bulk'?'active':''}" data-set-golden="bulk">대량 제작</button><button class="method-btn ${goldenMode==='single'?'active':''}" data-set-golden="single">개별 제작</button></div>`:''}
      ${fac.groups.map(g=>groupSection(g,id)).join('')}
      <div class="help-line"><span class="help-dot">ⓘ</span> 재료를 가리키면 1단계 하위 제작 재료가 표시되고, 누르면 더 자세한 제작법을 볼 수 있어요.</div>`;
    document.title=`${fac.title} | 띵타이쿤 WIKI`;
  }
  function itemUses(name) {
    const items=[];
    for(const fac of Object.values(D.facilities)) {
      for(const group of fac.groups){
        for(const rr of group.recipes){
          if(rr.ingredients.some(i=>i.name===name)) {
            if(items.some(x=>x.name===rr.name && x.fac===fac.id))continue;
            items.push({name:rr.name,fac:fac.id});
          }
        }
      }
    }
    return items.slice(0,24);
  }
  function renderItem(name){
    const data=D.items[name];if(!data)return renderNotFound();
    const variants=getRecipes(name);
    const uses=itemUses(name);
    let first=variants.find(v=>v.facility);let fac=first?.facility?D.facilities[first.facility]:null;
    const directItems=variants.filter(v=>v.facility);
    const standalone=variants.filter(v=>!v.facility);
    const mainVariants=directItems.length?directItems:standalone;
    app.innerHTML=crumb([[fac?.title||'아이템 사전',fac?facilityUrl(fac.id):null],[name,null]])+
      `<section class="item-profile">${art(name,'large')}<div><span class="eyebrow">ITEM DETAIL</span><h1>${esc(name)}</h1><p>${data.rank?`${esc(data.rank)} · `:''}${data.price!=null?`판매가 ${fn(data.price)} G ${priceBadge(name)}`:variants.length?`${variants.length}개 제작 방식`:'제작 재료 정보'}</p></div>${fac?`<div class="item-actions"><a class="action-link" href="${facilityUrl(fac.id)}">${esc(fac.title)} →</a></div>`:''}</section>
      <div class="section-title"><h2>제작 레시피</h2><span class="count-pill">${mainVariants.length}개</span></div>
      ${mainVariants.length?`<div class="recipe-grid">${mainVariants.map(({recipe:r})=>recipeCard(r,fac?.id||'')).join('')}</div>`:`<div class="blank-state">이 아이템은 현재 등록된 직접 제작법이 없습니다. 재료 수집 또는 구매를 통해 획득할 수 있습니다.</div>`}
      ${uses.length?`<div class="section-title" style="margin-top:35px"><h2>사용되는 곳</h2><span class="count-pill">${uses.length}개</span></div><div class="facility-grid">${uses.map(({name:n,fac:fid})=>`<a class="facility-card" style="min-height:102px;padding:17px" href="${itemUrl(n)}"><div class="facility-card-top">${art(n,'medium')}<span class="facility-arrow">↗</span></div><div><h3 style="font-size:14px">${esc(n)}</h3><p>${esc(D.facilities[fid]?.title||'제작법')}</p></div></a>`).join('')}</div>`:''}`;
    document.title=`${name} | 띵타이쿤 WIKI`;
  }

  // 세이지 도구 강화 단계별 재료 / 확률 — 제공받은 1~15강 표 그대로 반영.
  // {stage, low, mid, high, gold, ruby, chance}; 0은 원본 표의 '-'를 뜻함.
  const UPGRADE_STAGES = [
    {stage:1, low:1, mid:0, high:0, gold:5000, ruby:0, chance:100},
    {stage:2, low:2, mid:0, high:0, gold:25000, ruby:0, chance:100},
    {stage:3, low:2, mid:0, high:0, gold:50000, ruby:0, chance:80},
    {stage:4, low:3, mid:1, high:0, gold:100000, ruby:0, chance:80},
    {stage:5, low:3, mid:1, high:0, gold:130000, ruby:0, chance:70},
    {stage:6, low:4, mid:2, high:1, gold:150000, ruby:0, chance:50},
    {stage:7, low:4, mid:2, high:1, gold:170000, ruby:5, chance:40},
    {stage:8, low:6, mid:3, high:2, gold:300000, ruby:5, chance:30},
    {stage:9, low:6, mid:3, high:2, gold:350000, ruby:5, chance:20},
    {stage:10, low:8, mid:4, high:3, gold:500000, ruby:10, chance:10},
    {stage:11, low:8, mid:4, high:3, gold:700000, ruby:10, chance:5},
    {stage:12, low:8, mid:4, high:3, gold:1000000, ruby:10, chance:3},
    {stage:13, low:10, mid:6, high:4, gold:1300000, ruby:30, chance:2},
    {stage:14, low:10, mid:6, high:4, gold:1500000, ruby:30, chance:1},
    {stage:15, low:10, mid:6, high:5, gold:2000000, ruby:30, chance:1}
  ];
  const UPGRADE_MATERIALS = [
    {prop:'low', label:'하급 라이프스톤'},
    {prop:'mid', label:'중급 라이프스톤'},
    {prop:'high', label:'상급 라이프스톤'}
  ];
  const upgradeValue=(n, suffix='개') => n ? `${fn(n)}${suffix}` : '—';
  const upgradeStageButton = u => `<button type="button" data-select-upgrade="${u.stage}" class="upgrade-stage ${u.stage===upgradeSelectedStage?'selected':''}" aria-pressed="${u.stage===upgradeSelectedStage}" aria-label="${u.stage}강, 강화 확률 ${u.chance}%"><span class="upgrade-stage-level">${u.stage}<small>강</small></span><span class="upgrade-stage-prob">${u.chance}%</span></button>`;
  function upgradeStageDetails(u){
    return `<div class="upgrade-detail-top"><span class="eyebrow">SELECTED LEVEL / 강화 정보</span><span class="upgrade-current-pill">${u.stage}강</span></div>
      <div class="upgrade-detail-chance"><div><span>강화 성공 확률</span><strong>${u.chance}<small>%</small></strong></div><div class="upgrade-probtrack" role="meter" aria-label="강화 성공 확률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${u.chance}"><span style="width:${u.chance}%"></span></div></div>
      <h3 class="upgrade-materials-title">필요한 강화 재료</h3>
      <div class="upgrade-material-list">${UPGRADE_MATERIALS.filter(mat=>u[mat.prop]>0).map(mat=>`<a href="${itemUrl(mat.label)}" class="upgrade-material-item">${art(mat.label,'small')}<span>${esc(mat.label)}</span><strong>×${fn(u[mat.prop])}</strong></a>`).join('')}</div>
      <div class="upgrade-currency-grid"><div class="upgrade-currency"><span>필요 골드</span><strong>${fn(u.gold)} <small>G</small></strong></div><div class="upgrade-currency"><span>필요 루비</span><strong>${u.ruby?`${fn(u.ruby)}<small>개</small>`:'<small>없음</small>'}</strong></div></div>
      <p class="upgrade-detail-note">해당 강화 단계 1회 시도에 필요한 재료입니다.</p>`;
  }
  function selectUpgradeStage(level){
    const data = UPGRADE_STAGES.find(x=>x.stage===level);
    if (!data) return;
    upgradeSelectedStage = level;
    document.querySelectorAll('[data-select-upgrade]').forEach(el=>{
      const selected = Number(el.dataset.selectUpgrade)===level;
      el.classList.toggle('selected',selected);
      if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(selected));
    });
    document.querySelectorAll('[data-upgrade-col]').forEach(el=>el.classList.toggle('selected',Number(el.dataset.upgradeCol)===level));
    const detail = document.getElementById('upgradeStageDetail');
    if (detail) detail.innerHTML=upgradeStageDetails(data);
  }
  function upgradeComparisonTable(start,end){
    const selected=UPGRADE_STAGES.filter(row=>row.stage>=start && row.stage<=end);
    const label = (key,title,formatter) => `<tr><th scope="row">${title}</th>${selected.map(u=>`<td data-upgrade-col="${u.stage}" class="${u.stage===upgradeSelectedStage?'selected':''}">${formatter(u[key],u)}</td>`).join('')}</tr>`;
    return `<section class="upgrade-table-section"><div class="upgrade-table-head"><div><span class="upgrade-range-tag">${start} — ${end}</span><h2>${start}~${end}강</h2></div><span class="upgrade-table-caption">단계별 재료 · 1회 시도 기준</span></div>
      <div class="upgrade-table-scroll"><table class="upgrade-table"><thead><tr><th scope="col">필요 조건</th>${selected.map(u=>`<th scope="col"><button type="button" data-select-upgrade="${u.stage}" class="upgrade-table-stage ${u.stage===upgradeSelectedStage?'selected':''}" aria-pressed="${u.stage===upgradeSelectedStage}">${u.stage}강</button></th>`).join('')}</tr></thead><tbody>
      ${label('low','하급 라이프스톤',v=>upgradeValue(v))}
      ${label('mid','중급 라이프스톤',v=>upgradeValue(v))}
      ${label('high','상급 라이프스톤',v=>upgradeValue(v))}
      ${label('gold','필요 골드',v=>`${fn(v)} <span class="upgrade-gold-unit">G</span>`)}
      ${label('ruby','필요 루비',v=>v?`${fn(v)}개`:'—')}
      ${label('chance','강화 확률',v=>`<strong class="upgrade-table-percent">${v}%</strong><span class="upgrade-table-track"><span style="width:${v}%"></span></span>`)}
      </tbody></table></div></section>`;
  }
  function renderUpgrade(){
    const current=UPGRADE_STAGES.find(x=>x.stage===upgradeSelectedStage)||UPGRADE_STAGES[0];
    app.innerHTML=crumb([['도구 강화 확률',null]])+`
      <div class="page-head upgrade-page-head"><span class="eyebrow">SAGE TOOL · UPGRADE GUIDE</span><h1>도구 강화 확률</h1><p>세이지 도구의 1강부터 15강까지 필요한 라이프스톤·골드·루비와 단계별 강화 성공 확률을 정리했어요. 원하는 단계를 선택하면 필요한 재료를 바로 확인할 수 있어요.</p></div>
      <div class="upgrade-overview"><div class="upgrade-overview-stat"><span>강화 단계</span><strong>1 ~ 15<small>강</small></strong></div><div class="upgrade-overview-stat"><span>최고 성공 확률</span><strong>100<small>%</small></strong></div><div class="upgrade-overview-stat"><span>최저 성공 확률</span><strong>1<small>%</small></strong></div></div>
      <div class="upgrade-workspace"><section class="upgrade-picker" aria-label="강화 단계 선택"><div class="upgrade-panel-head"><span class="upgrade-panel-kicker">CHOOSE LEVEL</span><h2>강화 단계 선택</h2><p>숫자를 선택하면 오른쪽에 재료와 확률이 표시됩니다.</p></div>
      <div class="upgrade-stage-grid">${UPGRADE_STAGES.map(upgradeStageButton).join('')}</div>
      <div class="upgrade-stage-legend"><span>단계 번호</span><span>표시된 %는 해당 단계 성공 확률</span></div></section>
      <section class="upgrade-detail-panel" aria-label="선택한 강화 단계 재료" id="upgradeStageDetail">${upgradeStageDetails(current)}</section></div>
      <div class="upgrade-table-intro"><div><span class="eyebrow">ALL STAGES</span><h2>전체 강화 단계 비교</h2><p>표에서 강화 단계 숫자를 눌러 위의 상세 재료도 확인할 수 있어요.</p></div></div>
      <div class="upgrade-tables">${upgradeComparisonTable(1,5)}${upgradeComparisonTable(6,10)}${upgradeComparisonTable(11,15)}</div>
      <div class="upgrade-disclaimer"><span aria-hidden="true">ⓘ</span><p>제공된 세이지 도구 강화표를 기준으로 정리했어요. <b>—</b>는 해당 단계에 필요하지 않은 재료를 뜻합니다. 실패 시 처리 방식이나 추가 효과는 제공된 자료에 없어 표시하지 않았어요.</p></div>`;
    document.title='도구 강화 확률 | 띵타이쿤 WIKI';
  }

  function renderPrices(){
    document.title='요리 시세 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['요리 시세',null]])+`<div class="page-head"><span class="eyebrow">MARKET PRICES</span><h1>요리 시세</h1><p>일반 요리와 황금 요리의 최신 판매가 및 이전 가격과의 차이를 확인할 수 있습니다.</p></div><section class="experts-frame-shell price-frame-shell"><iframe id="pricesFrame" title="요리 판매가 확인 및 관리자 수정" src="prices.html?v=wiki40-expert-skill" loading="eager" scrolling="no"></iframe></section>`;
  }
  function renderCompare(){
    app.innerHTML=crumb([['효율 비교',null]])+`<div class="page-head compare-page-head"><span class="eyebrow">COOKING · PROFIT COMPARISON</span><h1>요리 효율 비교</h1><p>일반 요리와 황금요리의 판매가·기본 재료비 차감 순수익을 1개 / 50개 / 90개 기준으로 비교해 보세요.</p></div><div class="efficiency-embed"><iframe id="efficiencyFrame" title="띵타이쿤 전체 아이템 효율 순위 및 설정" src="efficiency.html?v=wiki41-iframe-size" loading="eager" scrolling="auto"></iframe></div>`;
    // v41: same-origin fallback if the child postMessage arrives before the parent listener.
    const ef=document.getElementById('efficiencyFrame');
    if(ef){
      const fit=()=>{
        try{
          const content=ef.contentDocument?.querySelector('main');
          if(!content)return;
          const height=Math.ceil(content.getBoundingClientRect().bottom+ef.contentWindow.scrollY+28);
          if(Number.isFinite(height)&&height>320&&height<100000&&Math.abs(ef.getBoundingClientRect().height-height)>4)ef.style.height=height+'px';
        }catch(_){}
      };
      ef.addEventListener('load',()=>{
        fit();
        try{
          const inner=ef.contentDocument?.querySelector('main');
          if(inner&&window.ResizeObserver)new ResizeObserver(fit).observe(inner);
        }catch(_){}
        requestAnimationFrame(fit);
      });
    }
    document.title='효율 비교 | 띵타이쿤 WIKI';
  }
  function compareRecipe(name){
    if(D.regular[name])return {price:D.regular[name].price,rank:D.regular[name].rank,output:1,inputs:Object.entries(D.regular[name].recipe)};
    if(D.golden[name]){
      const info=D.golden[name];const out=Math.round(1/info.powderPerItem);
      return {price:info.price,rank:info.rank,output:out,inputs:[[info.base,out],['금 가루',1]]};
    }
    return null;
  }
  function updateCompare(){
    const a=document.getElementById('compareA').value,b=document.getElementById('compareB').value;
    const ca=compareRecipe(a),cb=compareRecipe(b);if(!ca||!cb)return;
    const panel=(name,d)=>`<div class="compare-panel"><a href="${itemUrl(name)}"><div class="recipe-top">${art(name,'medium')}<h3>${esc(name)}</h3></div></a><div class="compare-price">${fn(d.price)} <small>G / 1개</small></div><p>${esc(d.rank)} · ${d.output}개 제작 기준 재료</p><div class="compare-materials">${d.inputs.map(([n,q])=>`<span>${esc(n)} ×${q}</span>`).join('')}</div></div>`;
    document.getElementById('compareOutput').innerHTML=`<div class="compare-panels">${panel(a,ca)}${panel(b,cb)}</div><div class="compare-result">판매가 차이: ${fn(Math.abs(ca.price-cb.price))} G · ${ca.price===cb.price?'판매가가 같습니다.':esc(ca.price>cb.price?a:b)+'의 1개 판매가가 더 높습니다.'} <br><span style="color:#a5bdc0">※ 제작 단위와 재료비가 다르므로 이 수치만으로 효율 우위를 판단할 수 없습니다.</span></div>`;
  }
  function drawPriceRows(){
    const t=document.getElementById('priceRows');if(!t)return;
    const items=compared.filter(([name])=>priceFilter==='all'||(priceFilter==='regular'?!!D.regular[name]:!!D.golden[name])).sort((a,b)=>b[1].price-a[1].price);
    t.innerHTML=items.map(([name,info])=>`<tr><td><a href="${itemUrl(name)}">${esc(name)}</a></td><td>${D.golden[name]?'황금 요리':'일반 요리'} · ${esc(info.rank)}</td><td>${fn(info.price)} G ${priceBadge(name)}</td></tr>`).join('');
    document.querySelectorAll('[data-price-filter]').forEach(el=>el.classList.toggle('active',el.dataset.priceFilter===priceFilter));
  }
  function renderNotFound(){app.innerHTML=`${crumb([['찾을 수 없음',null]])}<div class="blank-state">요청한 항목을 찾지 못했습니다. <a href="#/" style="color:#b2f5e6">위키 홈으로 돌아가기</a></div>`;}
  function currentRoute(){
    let hash=location.hash.slice(1);
    if(!hash||hash==='/')return {view:'home'};
    // 제작법 직접 링크: #/facility/cooking?recipe=토마토%20스파게티
    const question=hash.indexOf('?');
    const query=question>=0?hash.slice(question+1):'';
    if(question>=0)hash=hash.slice(0,question);
    const parts=hash.split('/').filter(Boolean);
    const view=parts[0];let id=parts.slice(1).join('/');
    try{id=decodeURIComponent(id)}catch(e){}
    const recipe=new URLSearchParams(query).get('recipe');
    const focus=new URLSearchParams(query).get('focus');
    return {view,id,recipe,focus};
  }
  let mapScale=1;
  function renderMap(){
    document.title='세레니티 지도 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['지도',null]])+`<div class="page-head"><span class="eyebrow">SERENITY · WORLD MAP</span><h1>세레니티 지도</h1><p>마을, 농장, 광산, 양식장 등의 위치를 확인하세요. 확대하면 원본 이미지의 좌표를 더 크게 볼 수 있습니다.</p></div>
      <section class="serenity-map-card" aria-label="세레니티 지도"><div class="serenity-map-bar"><strong>세레니티 전체 지도</strong><div class="serenity-map-tools"><button type="button" data-map-zoom="out" aria-label="지도 축소">−</button><span id="mapZoomLabel">100%</span><button type="button" data-map-zoom="in" aria-label="지도 확대">＋</button><button type="button" data-map-zoom="reset">맞춤</button><a href="assets/maps/serenity-map.png?v=20261030-map-update" target="_blank" rel="noopener" title="원본 크기로 열기">원본 보기 ↗</a></div></div>
      <div class="serenity-map-viewport" id="serenityMapViewport" tabindex="0" aria-label="스크롤하여 지도를 탐색"><img id="serenityMapImage" src="assets/maps/serenity-map.png?v=20261030-map-update" alt="띵타이쿤 세레니티 전체 지도. 농장, 광산, 마을, 양식장 위치와 좌표가 표시된 게임 지도." draggable="false"></div></section>`;
    mapScale=1;
  }
  function changeMapZoom(action){
    const viewport=document.getElementById('serenityMapViewport');
    const img=document.getElementById('serenityMapImage');
    const label=document.getElementById('mapZoomLabel');
    if(!viewport||!img)return;
    const next=action==='reset'?1:Math.min(3,Math.max(1,mapScale+(action==='in'?0.25:-0.25)));
    const centerX=viewport.scrollLeft+viewport.clientWidth/2;
    const centerY=viewport.scrollTop+viewport.clientHeight/2;
    const ratio=next/mapScale;
    mapScale=next;
    img.style.width=(mapScale*100)+'%';
    label.textContent=Math.round(mapScale*100)+'%';
    requestAnimationFrame(()=>{
      viewport.scrollLeft=centerX*ratio-viewport.clientWidth/2;
      viewport.scrollTop=centerY*ratio-viewport.clientHeight/2;
    });
  }
  function renderSkills(){
    document.title='전문가 스킬 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['전문가 스킬',null]])+`<div class="page-head expert-page-head"><span class="eyebrow">SERENITY · SKILL TREE</span><h1>전문가 스킬</h1><p>채광 · 재배 · 해양 · 사냥의 스킬 트리를 확인하고, 내 레벨과 앞으로 필요한 골드 및 어빌리티 스톤을 계산해 보세요.</p></div><section class="experts-frame-shell" aria-label="분야별 전문가 스킬 트리"><iframe id="expertsFrame" title="전문가 스킬 트리와 레벨 계산기" src="experts.html?v=wiki14" loading="eager" scrolling="no"></iframe></section>`;
    const frame=document.getElementById('expertsFrame');
    if(frame){frame.addEventListener('load',()=>{if(focusLoginOnLoad){focusLoginOnLoad=false;focusAccountLogin();}});}

  }
  function renderSageSimulator(){
    document.title='강화 시뮬레이터 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['강화 시뮬레이터',null]])+
      `<section aria-label="세이지 도구 강화 시뮬레이터" style="width:100%;max-width:840px;margin:0 auto;overflow:hidden;border:1px solid #e3e6eb;border-radius:16px;background:#f4f5f7">
        <iframe id="sageSimulatorFrame" title="세이지 도구 강화 시뮬레이터" src="sage-upgrade-simulator.html?v=wiki35-sage" loading="eager" scrolling="no" style="display:block;width:100%;height:1000px;border:0;background:transparent" ></iframe>
      </section>`;
    const frame=document.getElementById('sageSimulatorFrame');
    frame?.addEventListener('load',()=>{try{frame.contentWindow.postMessage({type:'dding-sage-simulator-measure'},'*')}catch(_){}});
  }
  // v37: Equipment stats table for all 4 sage tools, levels 1-15.
  function renderSageEquipmentTable(){
    document.title='세이지 장비 표 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['세이지 장비 표',null]])+
      `<div class="page-head"><span class="eyebrow">SAGE · EQUIPMENT STATS</span><h1>세이지 장비 표</h1><p>세이지 곡괭이 · 괭이 · 낚싯대 · 대검의 1~15강 능력치를 비교해 보세요. 장비 종류를 선택하거나 강화 단계를 눌러 확인할 수 있습니다.</p></div>
      <section class="sage-equipment-frame-shell" aria-label="세이지 장비 강화 능력치 표">
        <iframe id="sageEquipmentFrame" title="세이지 곡괭이·괭이·낚싯대·대검 1강부터 15강까지 능력치" src="sage-equipment-table.html?embed=1&v=wiki37" loading="eager" scrolling="no"></iframe>
      </section>`;
    const frame=document.getElementById('sageEquipmentFrame');
    frame?.addEventListener('load',()=>{try{frame.contentWindow.postMessage({type:'dding-sage-equipment-measure'},location.protocol==='file:'?'*':location.origin)}catch(_){}});
  }
  // v38: Fishing mini-game, isolated in its own iframe for independent keyboard input.
  function renderFishingGame(){
    document.title='낚시 게임 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['낚시 게임',null]])+
      `<div class="page-head"><span class="eyebrow">FISHING · MINI GAME</span><h1>낚시 게임</h1><p>W · A · S · D 키를 표시된 순서대로 눌러 물고기를 낚아보세요. 모바일은 화면의 방향키를 누르면 됩니다.</p></div>
      <section class="fishing-game-frame-shell" aria-label="낚시 미니게임">
        <iframe id="fishingGameFrame" title="낚시 미니게임: 방향키 순서 맞히기" src="fishing-game.html?embed=1&v=wiki38" loading="eager" scrolling="no"></iframe>
      </section>`;
    const frame=document.getElementById('fishingGameFrame');
    frame?.addEventListener('load',()=>{try{frame.contentWindow.postMessage({type:'dding-fishing-measure'},location.protocol==='file:'?'*':location.origin);}catch(_){}});
  }
  function renderBarista(){
    document.title='바리스타 계산기 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['바리스타 계산기',null]])+`<div class="page-head"><span class="eyebrow">SERENITY · BARISTA</span><h1>바리스타 계산기</h1><p>커피 종류와 잔 수, 프로 바리스타 및 커피값이 밥값 레벨을 설정하면 재료와 예상 판매 금액을 계산할 수 있어요.</p></div><section class="barista-frame-shell"><iframe id="baristaFrame" title="띵타이쿤 바리스타 커피 주문 계산기" src="barista-calculator.html?v=wiki19" loading="eager" scrolling="no" allow="clipboard-write"></iframe></section>`;
    const frame=document.getElementById('baristaFrame');
    if(frame)frame.addEventListener('load',()=>{
      try{frame.contentWindow.postMessage({type:'dding-barista-measure'},'*');}catch(_){}
    });
  }
  function renderFlorist(){
    document.title='플로리스트 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['플로리스트',null]])+`<div class="page-head"><h1>플로리스트</h1></div><section class="florist-frame-shell"><iframe id="floristFrame" title="꽃 판매와 플로리스트 향장품 제작법 및 재료 계산기" src="florist.html?v=wiki24-florist-assets-fix" loading="eager" scrolling="no"></iframe></section>`;
    const frame=document.getElementById('floristFrame');
    if(frame)frame.addEventListener('load',()=>{try{frame.contentWindow.postMessage({type:'dding-florist-measure'},'*');}catch(_){}});
  }
  function renderOcean(){
    document.title='배 낚시 해역 해도 | 띵타이쿤 WIKI';
    app.innerHTML=crumb([['배 낚시 해역',null]])+`<div class="page-head"><span class="eyebrow">SERENITY · OCEAN</span><h1>배 낚시 해역</h1><p>관리자가 설정한 오늘의 해역 3곳과 지역별 특징을 확인할 수 있어요.</p></div><section class="ocean-frame-shell"><iframe id="oceanFrame" title="배 낚시 해역 지도와 관리자 전용 개방 해역 설정" src="ocean-map.html?v=wiki25-ocean" loading="eager" scrolling="no"></iframe></section>`;
    const frame=document.getElementById('oceanFrame');
    if(frame)frame.addEventListener('load',()=>{
      try{frame.contentWindow.postMessage({type:'dding-ocean-measure'},location.origin);}catch(_){}
    });
  }
  // v27: Ocean crafting section. Recipe data will be added only when provided.
  // v28 · Ocean crafting and shop pages. Recipe and pricing data live in ocean-recipes-data.js.
  const oceanCraftingFacilities=[
    {id:'alchemy',name:'연금 제작 시설'},
    {id:'precision-alchemy',name:'정밀 연금 제작 시설'},
    {id:'marine',name:'해양 제작 시설'},
    {id:'sharky',name:'연금품 판매 · 샤키'},
    {id:'pos',name:'공예품 상점 · 포스'}
  ];
  // v33: Native ocean recipe screens reuse the exact same ingredient popup and card system
  // as 강화 연구소 / 강화 제작 시설. Only shop pages retain the existing sales iframe.
  const oceanIds=new Set(['alchemy','precision-alchemy','marine']);
  const oceanData=window.DDING_OCEAN_RECIPES;
  const oceanRecipeIndex=new Map((oceanData?.recipes||[]).map(r=>[r.id,r]));
  const oceanPlanKey='dding-ocean-craft-plan-v28';
  let oceanPlan=(()=>{try{const obj=JSON.parse(sessionStorage.getItem(oceanPlanKey)||'{}');return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{}}catch(_){return {}}})();
  let oceanSearch='',oceanGroup='all';
  const oceanQty=id=>Math.min(10000,Math.max(0,Math.trunc(Number(oceanPlan[id])||0)));
  function updateOceanQty(id,delta){
    if(!oceanRecipeIndex.has(id))return;
    const next=Math.max(0,Math.min(10000,oceanQty(id)+delta));
    if(next)oceanPlan[id]=next;else delete oceanPlan[id];
    try{sessionStorage.setItem(oceanPlanKey,JSON.stringify(oceanPlan))}catch(_){ }
    drawOceanPlan();
    app.querySelectorAll('[data-ocean-id]').forEach(el=>{
      if(el.dataset.oceanId===id){const label=el.querySelector('.ocean-recipe-actions span');if(label)label.textContent=`제작 목록 ${fn(next)}회`;}
    });
  }
  function oceanTabs(id){
    return `<nav class="ocean-native-tabs" aria-label="해양 시설 전환">${oceanCraftingFacilities.map(f=>
      `<a href="#/ocean-crafting/${esc(f.id)}" ${f.id===id?'class="active" aria-current="page"':''}>${esc(f.name)}</a>`).join('')}</nav>`;
  }
  function oceanFilteredGroups(id){
    const fac=D.facilities[id];
    return fac.groups.map(g=>({...g,recipes:g.recipes.filter(r=>
      (oceanGroup==='all'||g.title===oceanGroup)&&(!oceanSearch||[r.name,g.title,...r.ingredients.map(i=>i.name)].join(' ').toLowerCase().includes(oceanSearch))
    )})).filter(g=>g.recipes.length);
  }
  function drawOceanCatalog(id){
    const wrap=document.getElementById('oceanCatalog');if(!wrap)return;
    const groups=oceanFilteredGroups(id);
    wrap.innerHTML=groups.length?groups.map(g=>`<section class="ocean-catalog-group">
      <div class="ocean-group-title"><h2>${esc(g.title)}</h2><small>${g.recipes.length}개 제작법</small></div>
      <div class="recipe-grid">${g.recipes.map(r=>recipeCard(r,id)).join('')}</div>
    </section>`).join(''):'<div class="blank-state">검색 조건에 맞는 제작법이 없습니다.</div>';
    const c=document.getElementById('oceanResults');if(c)c.textContent=`${groups.reduce((n,g)=>n+g.recipes.length,0)}개 제작법 표시`;
    app.querySelectorAll('[data-ocean-filter]').forEach(btn=>{const active=btn.dataset.oceanFilter===oceanGroup;btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active))});
  }
  function oceanMaterials(){
    const selected=(oceanData?.recipes||[]).map(r=>({r,n:oceanQty(r.id)})).filter(x=>x.n);
    const total=selected.reduce((n,x)=>n+x.n*x.r.output,0);
    const ingredients=new Map();
    for(const {r,n} of selected)for(const i of r.ingredients)ingredients.set(i.name,(ingredients.get(i.name)||0)+i.quantity*n);
    return {selected,total,ingredients};
  }
  function drawOceanPlan(){
    const out=document.getElementById('oceanPlanContent');if(!out)return;
    const {selected,total,ingredients}=oceanMaterials();
    out.innerHTML=selected.length?`<div class="ocean-plan-items">${selected.map(({r,n})=>`<div class="ocean-plan-row">
      ${art(r.name+(r.stars?' '+'★'.repeat(r.stars):''),'tiny')}<div><strong>${esc(r.name)} ${'★'.repeat(r.stars)}</strong><small>제작 ${fn(n)}회 · 결과 ${fn(r.output*n)}개</small></div>
      <div class="ocean-plan-qty"><button type="button" data-ocean-qty="${esc(r.id)}" data-delta="-1" aria-label="${esc(r.name)} 1회 빼기">−</button><b>${fn(n)}</b><button type="button" data-ocean-qty="${esc(r.id)}" data-delta="1" aria-label="${esc(r.name)} 1회 추가">+</button></div>
    </div>`).join('')}</div><div class="ocean-plan-total"><span>완성품 합계</span><strong>${fn(total)}개</strong></div><h3>필요한 재료 합계</h3>
    ${[...ingredients].sort((a,b)=>a[0].localeCompare(b[0],'ko')).map(([name,n])=>`<div class="ocean-plan-material">${art(name,'tiny')}<span>${esc(name)}</span><strong>×${fn(n)}</strong></div>`).join('')}
    <button type="button" class="ocean-copy" data-ocean-copy>제작 내역 복사</button>`:'<div class="ocean-plan-empty">제작 목록이 비어 있어요. 카드의 담기 버튼을 눌러보세요.</div>';
  }
  function oceanCopyText(){
    const {selected,total,ingredients}=oceanMaterials();
    return ['[해양 제작 계획]',...selected.map(({r,n})=>`${r.name} ${'★'.repeat(r.stars)} ×${n}회 (완성 ${r.output*n}개)`),`완성품 총 ${total}개`,'[필요한 재료]',...[...ingredients].map(([name,n])=>`${name} ×${n}`)].join('\n');
  }
  async function copyOceanPlan(){
    const text=oceanCopyText();let copied=false;
    try{await navigator.clipboard.writeText(text);copied=true}catch(_){
      const box=document.createElement('textarea');box.value=text;box.style.position='fixed';box.style.left='-9999px';document.body.appendChild(box);box.select();try{copied=document.execCommand('copy')}catch(_){ }box.remove();
    }
    const btn=app.querySelector('[data-ocean-copy]');if(btn)btn.textContent=copied?'복사 완료':'복사 실패';
  }
  function renderOceanCrafting(id,focus){
    const facility=oceanCraftingFacilities.find(item=>item.id===id);
    if(!facility){renderNotFound();return;}
    document.title=`${facility.name} | 띵타이쿤 WIKI`;
    // 포스 공예품: 요리 시세와 동일한 공용 가격표 및 관리자 전용 저장 화면.
    if(id==='pos'){
      app.innerHTML=crumb([['해양',null],[facility.name,null]])+
        `<div class="page-head"><span class="eyebrow">MARKET PRICES</span><h1>공예품 상점 · 포스</h1><p>공예품 6종의 현재 판매가, 이전 가격과의 차이 및 등급을 확인할 수 있습니다.</p></div>`+
        oceanTabs(id)+
        `<section class="experts-frame-shell price-frame-shell"><iframe id="posPricesFrame" title="포스 공예품 판매가 확인 및 관리자 수정" src="pos-prices.html?v=wiki34-pos" loading="eager" scrolling="no"></iframe></section>`;
      return;
    }
    // 샤키는 기존 판매 수량 계산기를 유지합니다.
    if(!oceanIds.has(id)){
      app.innerHTML=crumb([['해양',null],[facility.name,null]])+
        `<section class="ocean-crafting-frame-shell"><iframe id="oceanCraftingFrame" title="${esc(facility.name)} 판매 계산" src="ocean-crafting.html?facility=${encodeURIComponent(id)}&v=wiki41-sales-readable" loading="eager" scrolling="no" allow="clipboard-write"></iframe></section>`;
      const frame=document.getElementById('oceanCraftingFrame');
      if(frame)frame.addEventListener('load',()=>{try{frame.contentWindow.postMessage({type:'dding-ocean-crafting-measure'},location.origin)}catch(_){}});
      return;
    }
    // Visiting another facility resets filters, but the shared crafting list stays intact.
    oceanSearch='';oceanGroup='all';
    const fac=D.facilities[id];
    app.innerHTML=crumb([['해양',null],[facility.name,null]])+`<div class="page-head ocean-native-title"><h1>${esc(fac.title)}</h1></div>`+
      oceanTabs(id)+`<section class="ocean-native-layout"><main class="ocean-native-main">
        <div class="ocean-tools"><input type="search" id="oceanSearch" placeholder="제작품이나 재료 이름 검색" aria-label="해양 제작품 검색" autocomplete="off">
          <div class="ocean-filters">${['all',...fac.groups.map(g=>g.title)].map(g=>`<button type="button" data-ocean-filter="${esc(g)}" ${g==='all'?'class="selected"':''}>${g==='all'?'전체':esc(g)}</button>`).join('')}</div></div>
        <div class="ocean-count" id="oceanResults" aria-live="polite"></div><div id="oceanCatalog"></div>
      </main><aside class="ocean-native-plan"><div class="ocean-plan-head"><h2>제작 재료 합계</h2><button type="button" data-ocean-reset>전체 초기화</button></div><div id="oceanPlanContent" aria-live="polite"></div></aside></section>`;
    drawOceanCatalog(id);drawOceanPlan();
    if(focus){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const card=[...app.querySelectorAll('.ocean-recipe-card[data-ocean-id]')].find(x=>x.dataset.oceanId===focus);
        if(!card)return;
        card.classList.add('ocean-highlight');card.setAttribute('tabindex','-1');
        card.scrollIntoView({behavior:'instant',block:'center'});card.focus({preventScroll:true});
      }));
    }
  }
  // v27: EXPLORE groups. Group state is saved per browser.

  const sidebarGroupsKey='dding-wiki-sidebar-groups-v26';
  const sidebarGroupsDefault={gather:true,mining:false,hunting:false,sea:false,other:false};
  const sidebarGroupsState=(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(sidebarGroupsKey)||'null');
      if(!saved || typeof saved!=='object')return {...sidebarGroupsDefault};
      return Object.fromEntries(Object.keys(sidebarGroupsDefault).map(key=>[key,typeof saved[key]==='boolean'?saved[key]:sidebarGroupsDefault[key]]));
    }catch(_){return {...sidebarGroupsDefault};}
  })();
  const sidebarStoreState=()=>{try{localStorage.setItem(sidebarGroupsKey,JSON.stringify(sidebarGroupsState))}catch(_){}};
  let sidebarLastRoute=null;
  const sidebarHasSavedState=(()=>{try{return localStorage.getItem(sidebarGroupsKey)!==null}catch(_){return false}})();
  function renderSidebar(route){
    const groupForCategory={kitchen:'gather',farm:'gather',lab:'mining',mining:'mining',soul:'hunting'};
    const groupForView={prices:'gather',barista:'gather',florist:'gather',upgrade:'other','sage-simulator':'other','sage-equipment':'other','fishing-game':'other',skills:'other',compare:'other',ocean:'other'};
    const currentGroup=route.view==='ocean-crafting'?'sea'
      :route.view==='category'?groupForCategory[route.id]
      :route.view==='facility'?groupForCategory[D.facilities[route.id]?.category]
      :groupForView[route.view];
    const routeKey=`${route.view||''}:${route.id||''}`;
    // When users navigate into a section from another page, reveal its selected link.
    // Manually collapsing a section while viewing it remains possible.
    if((sidebarLastRoute===null && !sidebarHasSavedState) || (sidebarLastRoute!==null && sidebarLastRoute!==routeKey)){
      if(currentGroup && !sidebarGroupsState[currentGroup]){
        sidebarGroupsState[currentGroup]=true;
        sidebarStoreState();
      }
    }
    sidebarLastRoute=routeKey;
    const categoryLink=id=>{
      const cat=D.categories.find(c=>c.id===id);
      if(!cat)return '';
      const active=(route.view==='category'&&route.id===id)
        ||(route.view==='facility'&&D.facilities[route.id]?.category===id)
        ||(route.view==='compare'&&id==='compare');
      return `<a class="nav-button nav-subitem ${active?'active':''}" href="${id==='compare'?'#/compare':catUrl(id)}" ${active?'aria-current="page"':''}><span class="nav-symbol">${iconSvg(cat.icon)}</span>${esc(cat.title)}</a>`;
    };
    const pageLink=(view,name,icon)=>{
      const active=route.view===view;
      const symbol=icon==='ocean'?'🌊':iconSvg(icon);
      return `<a class="nav-button nav-subitem ${active?'active':''}" href="#/${view}" ${active?'aria-current="page"':''}><span class="nav-symbol">${symbol}</span>${esc(name)}</a>`;
    };
    const oceanCraftingLink=facility=>{
      const active=route.view==='ocean-crafting'&&route.id===facility.id;
      return `<a class="nav-button nav-subitem ${active?'active':''}" href="#/ocean-crafting/${facility.id}" ${active?'aria-current="page"':''}><span class="nav-symbol">${iconSvg('book')}</span>${esc(facility.name)}</a>`;
    };
    const section=(key,title,icon,children)=>{
      const open=!!sidebarGroupsState[key];
      return `<section class="sidebar-group ${open?'is-open':''} ${currentGroup===key?'is-current':''}" data-nav-group="${key}">
        <button type="button" class="sidebar-group-toggle" data-nav-toggle="${key}" aria-controls="nav-group-${key}" aria-expanded="${open}"><span class="nav-symbol">${iconSvg(icon)}</span><span class="sidebar-group-title">${title}</span><span class="sidebar-group-chevron" aria-hidden="true">⌄</span></button>
        <div class="sidebar-group-items" id="nav-group-${key}" ${open?'':'hidden'}>${children}</div>
      </section>`;
    };
    const gathered=[categoryLink('kitchen'),pageLink('prices','요리 시세','chart'),categoryLink('farm'),pageLink('barista','바리스타 계산기','coffee'),pageLink('florist','플로리스트','flower')].join('');
    const mined=[categoryLink('lab'),categoryLink('mining')].join('');
    const hunted=categoryLink('soul');
    const seaItems=oceanCraftingFacilities.map(oceanCraftingLink).join('');
    const knownCategories=new Set(['kitchen','farm','lab','mining','soul','sea']);
    // Preserve all other existing navigation links rather than losing them.
    const additionalCategories=D.categories.filter(c=>!knownCategories.has(c.id)).map(c=>categoryLink(c.id)).join('');
    const miscellaneous=[pageLink('upgrade','도구 강화 확률','upgrade'),pageLink('sage-simulator','강화 시뮬레이터','upgrade'),pageLink('sage-equipment','세이지 장비 표','chart'),pageLink('fishing-game','낚시 게임','waves'),pageLink('skills','전문가 스킬','skills'),additionalCategories,pageLink('ocean','배 낚시 해역','ocean')].join('');
    nav.innerHTML=`<a class="nav-button nav-home ${route.view==='home'?'active':''}" href="#/" ${route.view==='home'?'aria-current="page"':''}><span class="nav-symbol">${iconSvg('home')}</span>위키 홈</a>`+
      section('gather','채집','sprout',gathered)+
      section('mining','채광','pickaxe',mined)+
      section('hunting','사냥','flame',hunted)+
      section('sea','해양','waves',seaItems)+
      section('other','기타','book',miscellaneous);
  }
  nav.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-nav-toggle]');
    if(!toggle||!nav.contains(toggle))return;
    const key=toggle.dataset.navToggle;
    if(!Object.hasOwn(sidebarGroupsState,key))return;
    sidebarGroupsState[key]=!sidebarGroupsState[key];
    sidebarStoreState();
    toggle.setAttribute('aria-expanded',String(sidebarGroupsState[key]));
    const group=toggle.closest('.sidebar-group');
    group?.classList.toggle('is-open',sidebarGroupsState[key]);
    const panel=document.getElementById(`nav-group-${key}`);
    if(panel)panel.hidden=!sidebarGroupsState[key];
  });
  function render(){
    hideTooltip();closeSearch();
    const route=currentRoute();renderSidebar(route);
    document.getElementById('headerMap')?.classList.toggle('active',route.view==='map');
    if(route.view==='facility' && route.recipe && ['cooking','golden'].includes(route.id)){
      const exists=D.facilities[route.id]?.groups.some(group=>group.recipes.some(r=>r.name===route.recipe));
      if(exists){
        if(route.id==='golden')goldenMode='bulk';
        pendingPriceRecipe={facility:route.id,name:route.recipe};
      }
    }
    if(route.view==='home')renderHome();
    else if(route.view==='category')renderCategory(route.id);
    else if(route.view==='facility')renderFacility(route.id);
    else if(route.view==='item')renderItem(route.id);
    else if(route.view==='upgrade')renderUpgrade();
    else if(route.view==='sage-simulator')renderSageSimulator();
    else if(route.view==='sage-equipment')renderSageEquipmentTable();
    else if(route.view==='fishing-game')renderFishingGame();
    else if(route.view==='skills')renderSkills();
    else if(route.view==='compare')renderCompare();
    else if(route.view==='prices')renderPrices();
    else if(route.view==='barista')renderBarista();
    else if(route.view==='florist')renderFlorist();
    else if(route.view==='ocean')renderOcean();
    else if(route.view==='ocean-crafting')renderOceanCrafting(route.id,route.focus);
    else if(route.view==='map')renderMap();
    else renderNotFound();
    // local navigation should start at the top; in-facility anchor scrolling handled separately
    if(lastRoute!==location.hash){window.scrollTo({top:0,behavior:'instant'});lastRoute=location.hash;}
    // The prices page is an iframe; scroll only after the target facility has rendered.
    if(pendingPriceRecipe && route.view==='facility' && route.id===pendingPriceRecipe.facility){
      const {name}=pendingPriceRecipe;
      pendingPriceRecipe=null;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const card=[...app.querySelectorAll('.recipe-card[data-item]')].find(el=>el.dataset.item===name);
        if(!card)return;
        card.setAttribute('tabindex','-1');
        card.classList.add('price-target-highlight');
        card.scrollIntoView({behavior:'auto',block:'center'});
        card.focus({preventScroll:true});
      }));
    }
  }
  function hideTooltip(){tip.classList.remove('show');tip.setAttribute('aria-hidden','true');lastTipName='';}
  function tooltipContent(name,qty){
    const methods=getRecipes(name).filter(x=>x.recipe?.ingredients?.length);
    const sample=methods.slice(0,3);
    return `<div class="tooltip-head">${art(name,'medium')}<div><b>${esc(name)}</b><span>사용 수량 ${qty}개</span></div></div>`+
      (sample.length? sample.map((info,i)=>`<div class="tooltip-mode">${esc(info.recipe.note||info.recipe.kind|| (sample.length>1?`${i+1}번째 제작법`:'제작 재료'))} · 완성 ×${fn(info.recipe.output)}</div>${info.recipe.ingredients.slice(0,8).map(({name:n,qty:q})=>`<div class="tooltip-row">${art(n,'tiny')}<span>${esc(n)}</span><em>×${fn(q)}</em></div>`).join('')}`).join('<div style="border-top:1px solid #33465c;margin:10px 0"></div>')+`<div class="tooltip-foot">클릭하면 제작법과 사용처를 자세히 볼 수 있어요.</div>`: '<div class="tooltip-muted">등록된 하위 제작법이 없는 재료입니다.</div>');
  }
  function showTooltipFor(btn){
    const name=btn.dataset.ingredient,qty=btn.dataset.quantity || '1';
    if(!name)return;
    if(lastTipName!==name+'_'+qty){tip.innerHTML=tooltipContent(name,qty);lastTipName=name+'_'+qty;}
    tip.classList.add('show');tip.setAttribute('aria-hidden','false');
    const rect=btn.getBoundingClientRect();
    const width=Math.min(window.innerWidth-18,310);
    tip.style.width=width+'px';
    const left=Math.min(Math.max(9,rect.left+Math.min(rect.width,150)-width/2),window.innerWidth-width-9);
    tip.style.left=left+'px';
    const size=tip.getBoundingClientRect();
    const above=rect.top-size.height-12;
    const below=rect.bottom+10;
    const top=above>10?above:(below+size.height<window.innerHeight-10?below:Math.max(10,window.innerHeight-size.height-10));
    tip.style.top=top+'px';
  }
  window.addEventListener('message',(e)=>{
    const iframe=document.getElementById('expertsFrame');
    const priceIframe=document.getElementById('pricesFrame');
    if(!e.data||e.data.type!=='dding-account-state'||![iframe?.contentWindow,priceIframe?.contentWindow].includes(e.source))return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    // 하위 제작시설 프레임의 인증 알림은 별도이며, 헤더 표시는 공용 인증 모듈이 관리합니다.
  });
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('posPricesFrame');
    if(!frame||e.source!==frame.contentWindow||!e.data)return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    if(e.data.type==='dding-pos-market-size'){
      const h=Number(e.data.height);
      if(Number.isFinite(h)&&h>200&&h<120000)frame.style.height=Math.ceil(h)+'px';
    }else if(e.data.type==='dding-pos-login-request'){
      if(window.DDING_SITE_AUTH)window.DDING_SITE_AUTH.open('login');
      else {focusLoginOnLoad=true;location.hash='#/skills';}
    }
  });
  window.addEventListener('message',(e)=>{
    const iframe=document.getElementById('expertsFrame');
    if(!iframe||e.source!==iframe.contentWindow||!e.data||e.data.type!=='dding-expert-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h)&&h>200&&h<150000&&Math.abs(iframe.getBoundingClientRect().height-h)>3)iframe.style.height=Math.ceil(h)+'px';
  });
  window.addEventListener('message',(e)=>{
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    if(!e.data)return;
    const frame=document.getElementById('pricesFrame');
    if(e.data.type==='dding-price-admin-size' && frame && e.source===frame.contentWindow){
      const h=Number(e.data.height);
      if(Number.isFinite(h)&&h>200&&h<120000)frame.style.height=Math.ceil(h)+'px';
    }
    if(e.data.type==='dding-price-login-request' && frame && e.source===frame.contentWindow){
      if(window.DDING_SITE_AUTH) window.DDING_SITE_AUTH.open('login');
      else { focusLoginOnLoad=true; location.hash='#/skills'; }
    }
    if(e.data.type==='dding-price-open-recipe' && frame && e.source===frame.contentWindow){
      const name=e.data.name;
      if(typeof name!=='string' || !P?.get(name))return;
      const facility=P.get(name).category==='황금 요리'?'golden':'cooking';
      if(!D.facilities[facility]?.groups.some(group=>group.recipes.some(recipe=>recipe.name===name)))return;
      pendingPriceRecipe={facility,name};
      const href=facilityUrl(facility);
      if(location.hash===href)render();
      else location.hash=href;
    }
  });
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('sageSimulatorFrame');
    if(!frame||e.source!==frame.contentWindow||!e.data||e.data.type!=='dding-sage-simulator-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:'&&e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h)&&h>250&&h<8000&&Math.abs(frame.getBoundingClientRect().height-h)>4){frame.style.height=Math.ceil(h)+'px';}
  });
  // Only messages from our exact table iframe may resize it.
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('sageEquipmentFrame');
    if(!frame||e.source!==frame.contentWindow||!e.data||e.data.type!=='dding-sage-equipment-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:'&&e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h)&&h>200&&h<12000&&Math.abs(frame.getBoundingClientRect().height-h)>4)frame.style.height=Math.ceil(h)+'px';
  });
  // The mini-game can grow when its on-screen controls wrap on mobile.
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('fishingGameFrame');
    if(!frame||e.source!==frame.contentWindow||!e.data||e.data.type!=='dding-fishing-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:'&&e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h)&&h>300&&h<2500&&Math.abs(frame.getBoundingClientRect().height-h)>4){
      frame.style.height=Math.ceil(h)+'px';
    }
  });
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('baristaFrame');
    if(!frame || e.source!==frame.contentWindow || !e.data || e.data.type!=='dding-barista-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h) && h>200 && h<30000 && Math.abs(frame.getBoundingClientRect().height-h)>5){
      frame.style.height=Math.ceil(h)+'px';
    }
  });
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('floristFrame');
    if(!frame || e.source!==frame.contentWindow || !e.data || e.data.type!=='dding-florist-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h) && h>200 && h<40000 && Math.abs(frame.getBoundingClientRect().height-h)>5){
      frame.style.height=Math.ceil(h)+'px';
    }
  });
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('oceanFrame');
    if(!frame || e.source!==frame.contentWindow || !e.data || e.data.type!=='dding-ocean-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h)&&h>200&&h<30000&&Math.abs(frame.getBoundingClientRect().height-h)>5)frame.style.height=Math.ceil(h)+'px';
  });
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('oceanCraftingFrame');
    if(!frame || e.source!==frame.contentWindow || !e.data || e.data.type!=='dding-ocean-crafting-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h) && h>180 && h<90000 && Math.abs(frame.getBoundingClientRect().height-h)>5)frame.style.height=Math.ceil(h)+'px';
  });
  window.addEventListener('message',(e)=>{
    const frame=document.getElementById('oceanCraftingFrame');
    if(!frame || e.source!==frame.contentWindow || e.data?.type!=='dding-ocean-crafting-focus')return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    const offset=Number(e.data.offset);
    if(!Number.isFinite(offset)||offset<0||offset>90000)return;
    window.scrollTo({top:Math.max(0,window.scrollY+frame.getBoundingClientRect().top+offset-150),behavior:'instant'});
  });
  window.addEventListener('dding-prices-updated',()=>{
    const route=currentRoute();
    if(['facility','item','compare'].includes(route.view))render();
  });
  window.addEventListener('message',(e)=>{
    const iframe=document.getElementById('efficiencyFrame');
    if(!iframe || e.source!==iframe.contentWindow || !e.data || e.data.type!=='dding-efficiency-size')return;
    if(e.origin!==location.origin && !(location.protocol==='file:' && e.origin==='null'))return;
    const h=Number(e.data.height);
    if(Number.isFinite(h) && h>200 && h<150000 && Math.abs(iframe.getBoundingClientRect().height-h)>3) iframe.style.height=Math.ceil(h)+'px';
  });
  app.addEventListener('mouseover',e=>{const b=e.target.closest('[data-ingredient]');if(b && !b.contains(e.relatedTarget))showTooltipFor(b);});
  app.addEventListener('mouseout',e=>{const b=e.target.closest('[data-ingredient]');if(b && !b.contains(e.relatedTarget))hideTooltip();});
  app.addEventListener('focusin',e=>{const b=e.target.closest('[data-ingredient]');if(b)showTooltipFor(b);});
  app.addEventListener('focusout',e=>{const b=e.target.closest('[data-ingredient]');if(b)hideTooltip();});
  app.addEventListener('input',e=>{if(e.target.id==='oceanSearch'){oceanSearch=e.target.value.toLowerCase().trim();drawOceanCatalog(currentRoute().id);}});
  app.addEventListener('click',e=>{
    const mapButton=e.target.closest('[data-map-zoom]');
    if(mapButton){changeMapZoom(mapButton.dataset.mapZoom);return;}
    const oceanAdd=e.target.closest('[data-ocean-add]');
    if(oceanAdd){updateOceanQty(oceanAdd.dataset.oceanAdd,1);return;}
    const oceanAdjust=e.target.closest('[data-ocean-qty]');
    if(oceanAdjust){updateOceanQty(oceanAdjust.dataset.oceanQty,Number(oceanAdjust.dataset.delta));return;}
    if(e.target.closest('[data-ocean-reset]')){
      oceanPlan={};try{sessionStorage.removeItem(oceanPlanKey)}catch(_){ }drawOceanPlan();
      app.querySelectorAll('.ocean-recipe-actions span').forEach(el=>el.textContent='제작 목록 0회');return;
    }
    if(e.target.closest('[data-ocean-copy]')){copyOceanPlan();return;}
    const oceanFilterButton=e.target.closest('[data-ocean-filter]');
    if(oceanFilterButton){oceanGroup=oceanFilterButton.dataset.oceanFilter;drawOceanCatalog(currentRoute().id);return;}
    const ing=e.target.closest('[data-ingredient]');
    if(ing){
      if(ing.dataset.oceanTarget){
        const destination=`#/ocean-crafting/${encodeURIComponent(ing.dataset.oceanTarget)}?focus=${encodeURIComponent(ing.dataset.oceanRecipe)}`;
        if(location.hash===destination)render();else location.hash=destination;
      }else location.hash=itemUrl(ing.dataset.ingredient);
      return;
    }
    const upgrade=e.target.closest('[data-select-upgrade]');
    if(upgrade){selectUpgradeStage(Number(upgrade.dataset.selectUpgrade));if(upgrade.classList.contains('upgrade-table-stage'))document.getElementById('upgradeStageDetail')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    const golden=e.target.closest('[data-set-golden]');
    if(golden){goldenMode=golden.dataset.setGolden;const scroll=window.scrollY;renderFacility('golden');window.scrollTo({top:scroll,behavior:'instant'});return;}
    const anchor=e.target.closest('[data-scroll-target]');
    if(anchor){e.preventDefault();document.getElementById(anchor.dataset.scrollTarget)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    const pf=e.target.closest('[data-price-filter]');
    if(pf){priceFilter=pf.dataset.priceFilter;drawPriceRows();return;}
  });
  function closeSearch(){searchResults.hidden=true;}
  function filterSearch(){
    const query=search.value.trim().toLowerCase();
    if(!query){closeSearch();return;}
    const names=sortedItemNames.filter(name=>name.toLowerCase().includes(query)).slice(0,9);
    searchResults.hidden=false;
    searchResults.innerHTML=names.length?names.map(name=>`<a class="search-result" href="${itemUrl(name)}">${art(name,'small')}<span><strong>${esc(name)}</strong><small>${getRecipes(name).length?'제작법 보기':'아이템 정보 보기'}</small></span></a>`).join(''):`<div class="search-empty">일치하는 아이템이 없어요.</div>`;
  }
  search.addEventListener('input',filterSearch);
  search.addEventListener('keydown',e=>{
    if(e.key==='Escape'){search.value='';closeSearch();search.blur();}
    if(e.key==='Enter'){
      const first=searchResults.querySelector('a');if(first){e.preventDefault();location.hash=first.getAttribute('href');search.value='';closeSearch();}
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();search.focus();}
    if(e.key==='Escape')hideTooltip();
  });
  document.addEventListener('click',e=>{if(!e.target.closest('#searchWrap'))closeSearch();});
  searchResults.addEventListener('click',()=>{search.value='';closeSearch();});
  window.addEventListener('hashchange',render);
  window.addEventListener('resize',hideTooltip);
  window.addEventListener('scroll',hideTooltip,{passive:true});
  if(!D||!D.categories){app.innerHTML='<div class="blank-state">데이터 파일을 찾을 수 없습니다. data.js 파일을 확인해주세요.</div>';return;}
  render();
})();
