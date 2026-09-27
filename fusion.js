(() => {
  if (typeof saveData === 'undefined' || typeof persist !== 'function' || typeof renderLobby !== 'function') return;

  const gradeOrder = typeof GRADE_ORDER !== 'undefined' ? GRADE_ORDER : ['F','E','D','C','B','A','S'];
  const gradeClass = typeof GRADE_CLASS !== 'undefined' ? GRADE_CLASS : {F:'gradeF',E:'gradeE',D:'gradeD',C:'gradeC',B:'gradeB',A:'gradeA',S:'gradeS'};

  function fLv(item){return item && item.fusionLevel ? item.fusionLevel : 0}
  function fLabel(item){return fLv(item)>0 ? ` · 합성 +${fLv(item)}` : ''}
  function key(item){return `${item.slot}|${item.grade}|${fLv(item)}`}
  function itemScore(item){
    const g=(gradeOrder.indexOf(item.grade)+1)*100000;
    const b=(Number(item.bonus)||0)*1000;
    return g+b+fLv(item)*100+(item.level||1);
  }
  function refreshBest(slot){
    const list=(saveData.inventory||[]).filter(i=>i.slot===slot);
    if(!list.length){delete saveData.equipment[slot];return;}
    list.sort((a,b)=>itemScore(b)-itemScore(a));
    saveData.equipment[slot]=list[0];
  }

  function ensureUI(){
    if(document.getElementById('fusionBtn')) return;
    const nav=document.querySelector('.bottomNav.simpleNav') || document.querySelector('.bottomNav');
    if(!nav)return;
    nav.classList.add('fusionNav');
    const btn=document.createElement('button');
    btn.className='navBtn';btn.id='fusionBtn';
    btn.innerHTML='<span>⚒️</span><span>장비 합성</span>';
    nav.appendChild(btn);

    const modal=document.createElement('div');
    modal.className='modal';modal.id='fusionModal';
    modal.innerHTML=`<div class="modalPanel"><div class="modalHead"><div class="modalTitle">⚒️ 장비 합성</div><button class="closeBtn" id="fusionClose">닫기</button></div><div class="fusionHelp">같은 <b>장비 · 등급 · 합성단계</b> 3개를 사용하면 같은 등급의 강화 장비 1개가 만들어져. 합성할 때마다 장비 효과가 약 30% 강해져.</div><div id="fusionList"></div></div>`;
    document.getElementById('wrap').appendChild(modal);
    btn.onclick=()=>{renderFusion();modal.style.display='flex'};
    modal.querySelector('#fusionClose').onclick=()=>modal.style.display='none';
    modal.addEventListener('pointerdown',e=>{if(e.target===modal)modal.style.display='none'});
  }

  function renderFusion(){
    const root=document.getElementById('fusionList');if(!root)return;
    root.innerHTML='';
    const inv=saveData.inventory||[];
    if(!inv.length){root.innerHTML='<div class="invItem">합성할 장비가 아직 없어.</div>';return;}
    const groups=new Map();
    for(const item of inv){const k=key(item);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(item)}
    const rows=[...groups.values()].sort((a,b)=>gradeOrder.indexOf(b[0].grade)-gradeOrder.indexOf(a[0].grade)||b.length-a.length);
    for(const items of rows){
      const item=items[0],can=items.length>=3;
      const row=document.createElement('div');row.className='fusionGroup';
      const effect=typeof bonusText==='function'?bonusText(item):String(item.bonus);
      row.innerHTML=`<div class="fusionTop"><div class="fusionItemInfo"><div class="fusionName">${item.emoji||'🎁'} <span class="pill ${gradeClass[item.grade]||''}">${item.grade}</span> ${item.label||'장비'}${fLabel(item)}</div><div class="fusionMeta">보유 ${items.length}개 · ${effect}<br>합성 성공 시 같은 등급 유지 + 효과 약 30% 증가</div></div><button class="fusionAction" ${can?'':'disabled'}>${can?'3개 합성':'3개 필요'}</button></div>`;
      if(can)row.querySelector('.fusionAction').onclick=()=>fuse(items.slice(0,3));
      root.appendChild(row);
    }
  }

  function fuse(items){
    if(!items||items.length<3)return;
    const base=items[0];
    if(items.some(i=>i.slot!==base.slot||i.grade!==base.grade||fLv(i)!==fLv(base)))return;
    const ids=new Set(items.map(i=>i.id));
    saveData.inventory=(saveData.inventory||[]).filter(i=>!ids.has(i.id));
    let bonus;
    if(base.bonusType==='cdr') bonus=+(Number(base.bonus)*1.30).toFixed(3);
    else bonus=Math.max(Number(base.bonus)+1,Math.round(Number(base.bonus)*1.30));
    const result={...base,id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),bonus,fusionLevel:fLv(base)+1,fromBoss:false};
    saveData.inventory.unshift(result);
    refreshBest(base.slot);
    persist();
    renderLobby();
    if(typeof renderInventory==='function')renderInventory();
    renderFusion();
    if(typeof showToast==='function')showToast(`⚒️ ${result.grade} ${result.label} 합성 +${result.fusionLevel} 완성!`);
  }

  const oldRenderInventory=typeof renderInventory==='function'?renderInventory:null;
  if(oldRenderInventory){
    renderInventory=function(){
      const wrap=document.getElementById('inventoryList');
      if(!wrap)return oldRenderInventory();
      const inv=saveData.inventory||[];
      if(!inv.length){wrap.innerHTML='<div class="invItem">아직 획득한 장비가 없음. 적과 보스를 처치해서 장비를 모아봐.</div>';return;}
      wrap.innerHTML='';
      inv.slice(0,80).forEach(item=>{
        const div=document.createElement('div');
        const eq=saveData.equipment[item.slot]?.id===item.id;
        div.className='invItem';
        const effect=typeof bonusText==='function'?bonusText(item):String(item.bonus);
        div.innerHTML=`<div class="invMain"><div class="invEmoji">${item.emoji||'🎁'}</div><div class="invText"><div class="invName">${item.grade} ${item.label||'장비'}${fLabel(item)} ${eq?'(장착중)':''}</div><div class="invSub">${effect} · Lv.${item.level||1} ${item.fromBoss?'· 보스드랍':''}</div></div></div><div class="pill ${gradeClass[item.grade]||''}">${item.grade}</div>`;
        wrap.appendChild(div);
      });
    };
  }

  ensureUI();
})();