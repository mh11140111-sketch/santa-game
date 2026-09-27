(() => {
  if (typeof shoot !== 'function' || typeof update !== 'function') return;
  const KEY='santaWeaponSystemV1';
  const defs=[
    {id:'giftgun',grade:'C',emoji:'🎁',name:'선물총',desc:'기본형. 안정적인 단발 공격',rate:1.0,power:1.0,pattern:'single'},
    {id:'snowrifle',grade:'C',emoji:'❄️',name:'눈송이 소총',desc:'공격속도 +25%, 피해량은 약간 낮음',rate:.75,power:.88,pattern:'single'},
    {id:'candyshot',grade:'B',emoji:'🍭',name:'사탕 산탄총',desc:'한 번에 3발을 퍼뜨려 발사',rate:1.35,power:.72,pattern:'triple'},
    {id:'elfsmg',grade:'B',emoji:'🧝',name:'엘프 기관총',desc:'매우 빠른 연사 속도',rate:.52,power:.64,pattern:'single'},
    {id:'reindeerbow',grade:'A',emoji:'🏹',name:'순록 활',desc:'2발의 강한 화살을 연속 발사',rate:1.15,power:1.35,pattern:'double'},
    {id:'starwand',grade:'A',emoji:'⭐',name:'별빛 지팡이',desc:'3방향 별탄을 발사',rate:1.05,power:1.0,pattern:'spread3'},
    {id:'aurora',grade:'S',emoji:'🌈',name:'오로라 캐논',desc:'5방향 오로라 탄막',rate:1.18,power:1.12,pattern:'spread5'},
    {id:'presentcannon',grade:'S',emoji:'🎄',name:'성탄 대포',desc:'느리지만 매우 강한 3연발 공격',rate:1.55,power:1.8,pattern:'double'}
  ];
  const weight={C:46,B:30,A:18,S:6};
  let data=load();
  let weaponClock=0;
  let oldBaseShotAt=-999;
  const baseShoot=shoot;
  function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v)return{owned:v.owned||{giftgun:1},equipped:v.equipped||'giftgun'}}catch(e){}return{owned:{giftgun:1},equipped:'giftgun'}}
  function save(){localStorage.setItem(KEY,JSON.stringify(data));renderUI()}
  function current(){return defs.find(w=>w.id===data.equipped)||defs[0]}
  function coinGet(){if(window.SantaCoinBank?.get)return window.SantaCoinBank.get();try{return JSON.parse(localStorage.getItem('santaPetSystemV1')||'{}').coins||0}catch(e){return 0}}
  function coinSpend(n){if(window.SantaCoinBank?.spend)return window.SantaCoinBank.spend(n);try{const d=JSON.parse(localStorage.getItem('santaPetSystemV1')||'{}');if((d.coins||0)<n)return false;d.coins-=n;localStorage.setItem('santaPetSystemV1',JSON.stringify(d));return true}catch(e){return false}}
  function weighted(){let total=defs.reduce((s,w)=>s+weight[w.grade],0),r=Math.random()*total;for(const w of defs){r-=weight[w.grade];if(r<=0)return w}return defs[0]}
  function addUI(){
    if(document.getElementById('weaponLobbyBtn'))return;
    const btn=document.createElement('button');btn.id='weaponLobbyBtn';btn.textContent='🔫 기본 무기';document.getElementById('lobby').appendChild(btn);
    const hud=document.createElement('div');hud.className='weaponHud';hud.id='weaponHud';document.getElementById('battleLayer').appendChild(hud);
    const modal=document.createElement('div');modal.id='weaponModal';modal.innerHTML=`<div id="weaponPanel"><div class="weaponTop"><h2>🔫 기본 무기 뽑기</h2><button class="weaponClose">닫기</button></div><div style="font-size:13px;color:#cbd8eb;margin-top:4px">1회 1000코인 · 획득한 무기는 영구 보유 · 전투 전에 자유롭게 교체</div><button class="weaponDraw">🪙 1000코인으로 1회 뽑기</button><div id="weaponResult">기본 공격 방식을 바꿀 무기를 뽑아봐!</div><div class="weaponGrid" id="weaponGrid"></div></div>`;document.getElementById('wrap').appendChild(modal);
    btn.onclick=()=>{modal.style.display='flex';renderUI()};modal.querySelector('.weaponClose').onclick=()=>modal.style.display='none';modal.querySelector('.weaponDraw').onclick=drawWeapon;
  }
  function drawWeapon(){const box=document.getElementById('weaponResult');if(!coinSpend(1000)){box.textContent='코인이 부족해! 1000코인이 필요해.';return}const w=weighted();data.owned[w.id]=(data.owned[w.id]||0)+1;if(!data.equipped)data.equipped=w.id;box.innerHTML=`${w.emoji} <b>${w.grade}등급 ${w.name}</b> 획득!<br><small>${w.desc}</small>`;save();if(typeof showToast==='function')showToast(`${w.emoji} ${w.name} 획득!`)}
  function renderUI(){const grid=document.getElementById('weaponGrid');const hud=document.getElementById('weaponHud');const w=current();if(hud)hud.textContent=`${w.emoji} ${w.name}`;if(!grid)return;grid.innerHTML='';for(const it of defs){const n=data.owned[it.id]||0;const card=document.createElement('button');card.className='weaponCard'+(data.equipped===it.id?' equipped':'');card.disabled=!n;card.innerHTML=`<div class="weaponEmoji">${it.emoji}</div><div class="weaponName">${it.name}</div><div class="weaponDesc">${it.desc}</div><div class="weaponGrade">${it.grade} · 보유 ${n}${data.equipped===it.id?' · 장착중':''}</div>`;card.onclick=()=>{if(!n)return;data.equipped=it.id;save();if(typeof showToast==='function')showToast(`${it.emoji} ${it.name} 장착`)};grid.appendChild(card)}}
  function fireAngle(from,target,dmg,speed,kind,offset=0){if(!target)return;const a=Math.atan2(target.y-from.y,target.x-from.x)+offset;bullets.push({x:from.x,y:from.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:5,dmg,life:2.2,kind})}
  function weaponFire(){const w=current(),tg=nearest(santa);if(!tg)return;const dmg=Math.round(attackPower*w.power);if(w.pattern==='single')baseShoot(santa,tg,dmg,500,'weapon');else if(w.pattern==='double'){fireAngle(santa,tg,dmg,510,'weapon',-.04);setTimeout(()=>{if(running)fireAngle(santa,nearest(santa),dmg,510,'weapon',.04)},85)}else if(w.pattern==='triple'){for(const o of[-.16,0,.16])fireAngle(santa,tg,dmg,470,'weapon',o)}else if(w.pattern==='spread3'){for(const o of[-.22,0,.22])fireAngle(santa,tg,dmg,500,'weapon',o)}else if(w.pattern==='spread5'){for(const o of[-.34,-.17,0,.17,.34])fireAngle(santa,tg,dmg,520,'weapon',o)}}
  const oldUpdate=update;
  update=function(dt){
    const beforeLastAuto=lastAuto;
    oldUpdate(dt);
    if(!running)return;
    // base auto-shot created by original update is suppressed by replacing its projectile immediately.
    if(lastAuto!==beforeLastAuto){for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];if(b.kind==='star'){bullets.splice(i,1);break}}}
    weaponClock+=dt;
    const interval=.42*current().rate;
    if(weaponClock>=interval){weaponClock=0;weaponFire()}
  };
  const oldReset=typeof reset==='function'?reset:null;if(oldReset){reset=function(){oldReset();weaponClock=0}}
  const oldDraw=draw;
  draw=function(){oldDraw();for(const b of bullets){if(b.kind==='weapon'){x.save();x.font='14px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(current().emoji,b.x,b.y);x.restore()}}};
  addUI();renderUI();
})();