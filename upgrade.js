(() => {
  if (typeof update !== 'function' || typeof reset !== 'function' || typeof draw !== 'function') return;

  let selectingSkill = false;
  let lastSkillChoiceWave = 1;
  let passiveClock = 0;
  let regenRate = 0;
  let giftPowerMult = 1;
  let runSkills = {};

  const upgrades = [
    {id:'atk',type:'기본 능력 강화',icon:'⚔️',name:'산타의 힘',desc:'기본 공격력과 직접 공격 피해가 20% 증가한다.',apply(){attackPower*=1.2}},
    {id:'hp',type:'기본 능력 강화',icon:'❤️',name:'튼튼한 산타복',desc:'최대 체력이 25% 증가하고 증가한 만큼 즉시 회복한다.',apply(){const old=maxHp;maxHp*=1.25;hp=Math.min(maxHp,hp+(maxHp-old))}},
    {id:'speed',type:'기본 능력 강화',icon:'💨',name:'눈길 질주',desc:'이동속도가 12% 증가한다.',apply(){if(typeof speedBonus==='number')speedBonus+=30;else santa.speed*=1.12}},
    {id:'regen',type:'기본 능력 강화',icon:'💚',name:'따뜻한 코코아',desc:'5초마다 최대 체력의 4%를 회복한다.',apply(){regenRate+=.04}},
    {id:'giftPower',type:'선물상자 강화',icon:'🎁',name:'고급 포장',desc:'모든 선물상자 스킬 피해가 25% 증가한다.',apply(){giftPowerMult*=1.25}},
    {id:'giftCd',type:'선물상자 강화',icon:'⏱️',name:'빠른 포장',desc:'선물상자 스킬 재사용 대기시간이 12% 감소한다.',apply(){cooldownMult=Math.max(.25,cooldownMult*.88)}},
    {id:'snowShot',type:'상시 발동 스킬',icon:'❄️',name:'자동 눈덩이',desc:'1.4초마다 가장 가까운 적에게 강한 눈덩이를 자동 발사한다.',apply(){}},
    {id:'lightning',type:'상시 발동 스킬',icon:'⚡',name:'크리스마스 번개',desc:'3초마다 가까운 적 최대 3명을 자동 공격한다.',apply(){}},
    {id:'aura',type:'상시 발동 스킬',icon:'🌟',name:'별빛 오라',desc:'산타 주변의 적에게 계속 피해를 준다.',apply(){}},
    {id:'drone',type:'상시 발동 스킬',icon:'🧸',name:'장난감 드론',desc:'드론이 산타를 따라다니며 0.8초마다 자동 사격한다.',apply(){}}
  ];

  function count(id){return runSkills[id]||0}
  function skillChoiceInterval(w){return 2 + Math.floor(Math.max(0,w-1)/30)*2}
  function isSkillChoiceWave(w){
    const blockStart=Math.floor(Math.max(0,w-1)/30)*30;
    const interval=skillChoiceInterval(w);
    const local=w-blockStart;
    return local>=interval && local%interval===0;
  }
  function addUI(){
    if(document.getElementById('skillSelect')) return;
    const select=document.createElement('div');
    select.id='skillSelect';
    select.innerHTML='<div class="skillSelectPanel"><div class="skillSelectTitle">스킬 선택</div><div class="skillSelectSub">이번 판에서만 유지되는 능력입니다. 3개 중 하나를 선택하세요.</div><div class="skillCards" id="skillCards"></div></div>';
    document.getElementById('wrap').appendChild(select);
    const bar=document.createElement('div');bar.id='runSkillBar';
    document.getElementById('battleLayer').appendChild(bar);
  }
  addUI();

  function renderBar(){
    const root=document.getElementById('runSkillBar');if(!root)return;root.innerHTML='';
    Object.entries(runSkills).filter(([,v])=>v>0).slice(-6).forEach(([id,v])=>{
      const u=upgrades.find(q=>q.id===id);if(!u)return;
      const d=document.createElement('div');d.className='runSkillChip';d.textContent=`${u.icon}${v>1?' '+v:''}`;root.appendChild(d);
    });
  }
  function choices(){const pool=[...upgrades],out=[];while(out.length<3&&pool.length){const i=Math.floor(Math.random()*pool.length);out.push(pool.splice(i,1)[0])}return out}
  function showSelect(){
    if(selectingSkill||!running)return;selectingSkill=true;
    const sub=document.querySelector('.skillSelectSub');
    if(sub) sub.textContent=`이번 판에서만 유지 · 현재 ${skillChoiceInterval(wave)}웨이브마다 선택 (30웨이브마다 간격 +2)`;
    const root=document.getElementById('skillCards');root.innerHTML='';
    choices().forEach(u=>{
      const btn=document.createElement('button');btn.className='skillCard';
      btn.innerHTML=`<div class="skillCardHead">${u.type}</div><div class="skillCardIcon">${u.icon}</div><div class="skillCardName">${u.name}</div><div class="skillCardDesc">${u.desc}</div><div class="skillType">${u.type}</div><div class="skillOwned">보유 Lv.${count(u.id)}</div>`;
      btn.onclick=()=>{runSkills[u.id]=count(u.id)+1;u.apply();selectingSkill=false;document.getElementById('skillSelect').style.display='none';renderBar();if(typeof showToast==='function')showToast(`${u.icon} ${u.name} Lv.${count(u.id)}`)};
      root.appendChild(btn);
    });
    document.getElementById('skillSelect').style.display='flex';
  }

  const oldGiftDmg=typeof giftDmg==='function'?giftDmg:null;
  if(oldGiftDmg){giftDmg=function(mult){return Math.round(oldGiftDmg(mult)*giftPowerMult)}}

  const oldReset=reset;
  reset=function(){
    oldReset();selectingSkill=false;lastSkillChoiceWave=1;passiveClock=0;regenRate=0;giftPowerMult=1;runSkills={};
    const sel=document.getElementById('skillSelect');if(sel)sel.style.display='none';renderBar();
  };

  function passive(dt){
    passiveClock+=dt;
    const snowLv=count('snowShot'),lightLv=count('lightning'),auraLv=count('aura'),droneLv=count('drone');
    if(snowLv && passiveClock%1.4<dt){const tg=nearest(santa);if(tg){shoot(santa,tg,Math.round(attackPower*(1.2+.35*snowLv)),560,'snow');if(typeof ringFx==='function')ringFx(santa.x,santa.y,'#a9efff',.25)}}
    if(lightLv && passiveClock%3<dt){const arr=[...enemies].sort((a,b)=>dist(santa,a)-dist(santa,b)).slice(0,Math.min(2+lightLv,6));for(const e of arr){e.hp-=attackPower*(1.5+.4*lightLv);if(typeof ringFx==='function')ringFx(e.x,e.y,'#ffe95c',.28)}}
    if(auraLv){for(const e of enemies)if(dist(santa,e)<95+auraLv*8)e.hp-=attackPower*(.85+.18*auraLv)*dt}
    if(droneLv && passiveClock%.8<dt){const tg=nearest(santa);if(tg){const a=passiveClock*3;shoot({x:santa.x+Math.cos(a)*38,y:santa.y+Math.sin(a)*38},tg,Math.round(attackPower*(.65+.18*droneLv)),520,'drone')}}
    if(regenRate>0 && passiveClock%5<dt)hp=Math.min(maxHp,hp+maxHp*regenRate);
  }

  const oldUpdate=update;
  update=function(dt){
    if(selectingSkill)return;
    oldUpdate(dt);
    if(!running)return;
    passive(dt);
    if(isSkillChoiceWave(wave) && wave!==lastSkillChoiceWave){lastSkillChoiceWave=wave;showSelect()}
  };

  const oldDraw=draw;
  draw=function(){
    oldDraw();
    x.save();
    if(count('aura')){x.strokeStyle='rgba(255,244,120,.46)';x.lineWidth=4;x.shadowColor='#fff38b';x.shadowBlur=10;x.beginPath();x.arc(santa.x,santa.y,95+count('aura')*8,0,Math.PI*2);x.stroke();x.shadowBlur=0}
    if(count('drone')){const a=passiveClock*3,dx=santa.x+Math.cos(a)*38,dy=santa.y+Math.sin(a)*38;x.font='22px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🧸',dx,dy)}
    x.restore();
  };
})();