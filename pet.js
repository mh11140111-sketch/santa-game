(() => {
  if (typeof update !== 'function' || typeof draw !== 'function') return;

  const PET_KEY='santaPetSystemV1';
  const petDefs=[
    {id:'snowman',grade:'C',emoji:'⛄',name:'꼬마 눈사람',type:'attack',desc:'1.4초마다 가까운 적에게 눈덩이를 던짐',power:.75,rate:1.4},
    {id:'elf',grade:'B',emoji:'🧝',name:'엘프 궁수',type:'attack',desc:'0.9초마다 빠른 지원사격',power:.68,rate:.9},
    {id:'reindeer',grade:'A',emoji:'🦌',name:'순록',type:'atkBuff',desc:'산타 공격력 +20%',value:.20},
    {id:'bear',grade:'B',emoji:'🧸',name:'북극곰 인형',type:'hpBuff',desc:'최대 체력 +25%',value:.25},
    {id:'star',grade:'S',emoji:'🌟',name:'크리스마스 별',type:'allBuff',desc:'공격력 +15%, 최대 체력 +15%, 선물 쿨타임 -8%',value:.15},
    {id:'penguin',grade:'C',emoji:'🐧',name:'펭귄',type:'attack',desc:'1.8초마다 관통 얼음탄 발사',power:1.0,rate:1.8},
    {id:'angel',grade:'A',emoji:'👼',name:'천사',type:'regen',desc:'5초마다 최대 체력의 5% 회복',value:.05}
  ];
  const gradeWeight={C:46,B:28,A:18,S:8};
  let data=load();
  let coinDrops=[];
  let petClock=0;
  let petShotClock=0;
  let petRegenClock=0;

  function load(){try{const v=JSON.parse(localStorage.getItem(PET_KEY)||'null');if(v)return {coins:v.coins||0,pets:v.pets||{},equipped:v.equipped||null}}catch(e){}return{coins:0,pets:{},equipped:null}}
  function save(){localStorage.setItem(PET_KEY,JSON.stringify(data));renderPetUI();}
  function ownedCount(id){return data.pets[id]||0}
  function weightedPet(){let total=0;for(const p of petDefs) total+=gradeWeight[p.grade];let r=Math.random()*total;for(const p of petDefs){r-=gradeWeight[p.grade];if(r<=0)return p}return petDefs[0]}
  function equippedPet(){return petDefs.find(p=>p.id===data.equipped)||null}

  function addUI(){
    if(document.getElementById('petLobbyBtn'))return;
    const btn=document.createElement('button');btn.id='petLobbyBtn';btn.textContent='🐾 펫 뽑기';document.getElementById('lobby').appendChild(btn);
    const coin=document.createElement('div');coin.id='coinHud';coin.textContent='🪙 0';document.getElementById('wrap').appendChild(coin);
    const modal=document.createElement('div');modal.id='petModal';
    modal.innerHTML=`<div id="petPanel"><div class="petTop"><h2>🐾 펫 뽑기</h2><button class="petClose">닫기</button></div><div style="font-size:13px;color:#cbd8eb;margin-top:4px">1회 500코인 · 펫은 영구 보유 · 한 마리 장착</div><button class="petDraw">🪙 500코인으로 1회 뽑기</button><div id="petResult">펫을 뽑아봐!</div><div class="petGrid" id="petGrid"></div></div>`;
    document.getElementById('wrap').appendChild(modal);
    btn.onclick=()=>{modal.style.display='flex';renderPetUI()};
    modal.querySelector('.petClose').onclick=()=>modal.style.display='none';
    modal.querySelector('.petDraw').onclick=drawPet;
  }
  function drawPet(){
    if(data.coins<500){document.getElementById('petResult').textContent='코인이 부족해! 적을 처치해서 코인을 모아야 해.';return}
    data.coins-=500;
    const p=weightedPet();data.pets[p.id]=(data.pets[p.id]||0)+1;
    if(!data.equipped)data.equipped=p.id;
    document.getElementById('petResult').innerHTML=`${p.emoji} <b>${p.grade}등급 ${p.name}</b> 획득!<br><small>${p.desc}</small>`;
    save();
  }
  function renderPetUI(){
    const coin=document.getElementById('coinHud');if(coin)coin.textContent=`🪙 ${data.coins}`;
    const grid=document.getElementById('petGrid');if(!grid)return;grid.innerHTML='';
    for(const p of petDefs){const n=ownedCount(p.id);const card=document.createElement('button');card.className='petCard'+(data.equipped===p.id?' equipped':'');card.disabled=!n;card.innerHTML=`<div class="petEmoji">${p.emoji}</div><div class="petName">${p.name}</div><div class="petDesc">${p.desc}</div><div class="petGrade">${p.grade} · 보유 ${n}</div>`;card.onclick=()=>{if(n){data.equipped=p.id;save();if(typeof showToast==='function')showToast(`${p.emoji} ${p.name} 장착`)}};grid.appendChild(card)}
  }
  function dropCoin(x,y,isBoss){
    const chance=isBoss?.82:.2;if(Math.random()>chance)return;
    const amount=isBoss?Math.floor(250+Math.random()*251):Math.floor(35+Math.random()*66);
    coinDrops.push({x,y,amount,life:12});
  }

  const oldSetup=typeof setupRun==='function'?setupRun:null;
  if(oldSetup){setupRun=function(){oldSetup();const p=equippedPet();if(!p)return;if(p.type==='atkBuff')attackPower*=1+p.value;else if(p.type==='hpBuff'){maxHp*=1+p.value;hp=maxHp}else if(p.type==='allBuff'){attackPower*=1+p.value;maxHp*=1+p.value;hp=maxHp;cooldownMult*=.92}}}

  const oldReset=typeof reset==='function'?reset:null;
  if(oldReset){reset=function(){oldReset();coinDrops=[];petClock=0;petShotClock=0;petRegenClock=0}}

  const oldUpdate=update;
  update=function(dt){
    const before=[...enemies];
    oldUpdate(dt);
    if(!running)return;
    petClock+=dt;petShotClock+=dt;petRegenClock+=dt;
    const alive=new Set(enemies);
    for(const e of before){if(!alive.has(e)&&e.hp<=0)dropCoin(e.x,e.y,!!e.boss)}
    for(const d of coinDrops){d.life-=dt;const dd=Math.hypot(santa.x-d.x,santa.y-d.y);if(dd<150){const a=Math.atan2(santa.y-d.y,santa.x-d.x);d.x+=Math.cos(a)*220*dt;d.y+=Math.sin(a)*220*dt}if(dd<28){data.coins+=d.amount;d.life=0;save();if(typeof showToast==='function')showToast(`🪙 +${d.amount}`)}}
    coinDrops=coinDrops.filter(d=>d.life>0);
    const p=equippedPet();if(!p)return;
    if(p.type==='attack'&&petShotClock>=p.rate){petShotClock=0;const tg=nearest(santa);if(tg){const a=petClock*2.6;const from={x:santa.x+Math.cos(a)*42,y:santa.y+Math.sin(a)*42};shoot(from,tg,Math.round(attackPower*p.power),540,'pet')}}
    if(p.type==='regen'&&petRegenClock>=5){petRegenClock=0;hp=Math.min(maxHp,hp+maxHp*p.value)}
  };

  const oldDraw=draw;
  draw=function(){
    oldDraw();
    x.save();
    for(const d of coinDrops){x.font='22px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🪙',d.x,d.y);x.font='10px sans-serif';x.fillStyle='#ffe36a';x.fillText('+'+d.amount,d.x,d.y+16)}
    const p=equippedPet();if(p&&running){const a=petClock*2.6,px=santa.x+Math.cos(a)*42,py=santa.y+Math.sin(a)*42;x.font='25px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(p.emoji,px,py)}
    x.restore();
  };

  addUI();renderPetUI();
})();