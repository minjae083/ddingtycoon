'use strict';
(() => {
  const D = window.DDING_WIKI_DATA;
  const app = document.getElementById('app');
  const nav = document.getElementById('sideNavigation');
  const search = document.getElementById('globalSearch');
  const searchResults = document.getElementById('searchResults');
  const tip = document.getElementById('hoverTooltip');
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
    diamond:'<path d="M6 4h12l4 6-10 11L2 10z"/><path d="M2 10h20M6 4l6 17L18 4"/>',
    utensils:'<path d="M4 3v8c0 2 4 2 4 0V3M6 3v18M14 3c-2 2-2 6-2 9h5V3M17 12v9"/>',
    pickaxe:'<path d="m4 21 13-13"/><path d="M12 3c5-2 9 0 10 3-5-1-8 1-10 4"/><path d="m7 9 4 4"/>',
    sprout:'<path d="M12 22v-9M12 13c-8 0-9-4-9-9 6 0 10 2 9 9zm0 4c0-7 4-10 9-10 0 6-2 10-9 10z"/>',
    upgrade:'<path d="M12 22V7m-5 5 5-5 5 5"/><path d="M4 15V4h16v11"/><path d="M7 19h10"/>',
    chart:'<path d="M3 20h18M6 17v-5M11 17V7M16 17v-8"/>',
    flame:'<path d="M12 22c4.5 0 7.5-3.1 7.5-7.4 0-3.8-2.1-6.2-5.2-9.6.3 4.5-2.2 5.4-2.4 6.5C10.3 8.2 9 5.2 9.4 2 5.1 6.6 4 10.7 4 14.6 4 18.9 7.3 22 12 22Z"/><path d="M12 21c-1.9 0-3.2-1.4-3.2-3.2 0-1.6 1.1-2.9 2.8-4.5.1 2 1.1 2.8 2.3 3.6 1 2.1.1 4.1-1.9 4.1Z"/>',
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
  function field(name, qty) {
    const hasRecipe=getRecipes(name).length>0;
    return `<button type="button" class="ingredient-chip" data-ingredient="${esc(name)}" data-quantity="${esc(qty)}" aria-label="${esc(name)}, ${qty}개. 제작 재료를 확인하려면 선택하세요">${art(name,'small')}<span class="chip-name">${esc(name)}</span>${hasRecipe?'<span class="has-recipe-dot" title="제작법 있음"></span>':''}<span class="chip-qty">×${fn(qty)}</span></button>`;
  }
  function recipeCard(item, fac='') {
    const price=item.price!=null?`<span class="recipe-sub">판매가 ${fn(item.price)} G · 1개 기준</span>`:item.method?`<span class="recipe-sub">${item.method==='bulk'?'금 가루 · 대량 제작':'식용 금 가루 · 개별 제작'}</span>`:`<span class="recipe-sub">${item.note||'제작 재료'}</span>`;
    return `<article class="recipe-card" data-method="${esc(item.method||'')}" data-item="${esc(item.name)}">
      <div class="recipe-top">
        <a class="item-button" href="${itemUrl(item.name)}" aria-label="${esc(item.name)} 상세 페이지">${item.variantImage?`<span class="item-art large"><img loading="lazy" src="${esc(item.variantImage)}?v=wiki6" alt=""></span>`:art(item.name,'large')}</a>
        <div class="recipe-intro">
          ${item.rank?`<span class="rank-tag ${rankClass(item.rank)}">${esc(item.rank)}</span>`:item.kind?`<span class="rank-tag">${esc(item.kind)}</span>`:''}
          <h3><a class="recipe-title-link" href="${itemUrl(item.name)}">${esc(item.name)}</a></h3>
          ${price}
        </div>
        <span class="yield">완성 ×${fn(item.output||1)}</span>
      </div>${item.ingredients.length?`<div class="ingredients-grid">${item.ingredients.map(({name,qty})=>field(name,qty)).join('')}</div>`:`<div class="recipe-unregistered">제작법 정보가 아직 등록되지 않았습니다. 아이콘은 제공된 이미지로 표시합니다.</div>`}
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
      `<section class="item-profile">${art(name,'large')}<div><span class="eyebrow">ITEM DETAIL</span><h1>${esc(name)}</h1><p>${data.rank?`${esc(data.rank)} · `:''}${data.price!=null?`기준 판매가 ${fn(data.price)} G`:variants.length?`${variants.length}개 제작 방식`:'제작 재료 정보'}</p></div>${fac?`<div class="item-actions"><a class="action-link" href="${facilityUrl(fac.id)}">${esc(fac.title)} →</a></div>`:''}</section>
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

  function renderCompare(){
    app.innerHTML=crumb([['효율 비교',null]])+`<div class="page-head compare-page-head"><span class="eyebrow">1000 ST · PROFIT RANKING</span><h1>아이템 효율 비교</h1><p>요리 · 황금 요리 · 라이프스톤 · 주괴까지 같은 기준으로 확인해보세요. 1,000 ST 제작 가능 수량, 예상 순수익, 재료와 판매가 설정도 변경할 수 있어요.</p></div><div class="efficiency-embed"><iframe id="efficiencyFrame" title="띵타이쿤 전체 아이템 효율 순위 및 설정" src="efficiency.html?v=2" loading="eager" scrolling="no"></iframe></div>`;
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
    t.innerHTML=items.map(([name,info])=>`<tr><td><a href="${itemUrl(name)}">${esc(name)}</a></td><td>${D.golden[name]?'황금 요리':'일반 요리'} · ${esc(info.rank)}</td><td>${fn(info.price)} G</td></tr>`).join('');
    document.querySelectorAll('[data-price-filter]').forEach(el=>el.classList.toggle('active',el.dataset.priceFilter===priceFilter));
  }
  function renderNotFound(){app.innerHTML=`${crumb([['찾을 수 없음',null]])}<div class="blank-state">요청한 항목을 찾지 못했습니다. <a href="#/" style="color:#b2f5e6">위키 홈으로 돌아가기</a></div>`;}
  function currentRoute(){
    let hash=location.hash.slice(1);
    if(!hash||hash==='/')return {view:'home'};
    const parts=hash.split('/').filter(Boolean);
    const view=parts[0];let id=parts.slice(1).join('/');
    try{id=decodeURIComponent(id)}catch(e){}
    return {view,id};
  }
  function renderSidebar(route){
    const categoryLinks=D.categories.map(c=>`<a class="nav-button ${route.id===c.id || (route.view==='facility'&&D.facilities[route.id]?.category===c.id) || (route.view==='compare'&&c.id==='compare')?'active':''}" href="${c.id==='compare'?'#/compare':catUrl(c.id)}"><span class="nav-symbol">${iconSvg(c.icon)}</span>${esc(c.title)}</a>`);
    const compareIndex=D.categories.findIndex(c=>c.id==='compare');
    categoryLinks.splice(compareIndex<0?categoryLinks.length:compareIndex,0,`<a class="nav-button ${route.view==='upgrade'?'active':''}" href="#/upgrade"><span class="nav-symbol">${iconSvg('upgrade')}</span>도구 강화 확률</a>`);
    nav.innerHTML=`<a class="nav-button ${route.view==='home'?'active':''}" href="#/"><span class="nav-symbol">${iconSvg('home')}</span>위키 홈</a>`+categoryLinks.join('');
  }
  function render(){
    hideTooltip();closeSearch();
    const route=currentRoute();renderSidebar(route);
    if(route.view==='home')renderHome();
    else if(route.view==='category')renderCategory(route.id);
    else if(route.view==='facility')renderFacility(route.id);
    else if(route.view==='item')renderItem(route.id);
    else if(route.view==='upgrade')renderUpgrade();
    else if(route.view==='compare')renderCompare();
    else renderNotFound();
    // local navigation should start at the top; in-facility anchor scrolling handled separately
    if(lastRoute!==location.hash){window.scrollTo({top:0,behavior:'instant'});lastRoute=location.hash;}
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
  app.addEventListener('click',e=>{
    const ing=e.target.closest('[data-ingredient]');
    if(ing){location.hash=itemUrl(ing.dataset.ingredient);return;}
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
