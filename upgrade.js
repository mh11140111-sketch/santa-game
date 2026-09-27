(() => {
  if (typeof update !== 'function' || typeof reset !== 'function' || typeof draw !== 'function') return;

  let selectingSkill = false;
  window.__skillSelecting = false;
  let lastSkillChoiceWave = 1;
  let passiveClock = 0;
  let regenRate = 0;
  let giftPowerMult = 1;
  let runSkills = {};

  let defenseMax = 0;
  let defenseNow = 0;
  let defenseRechargeClock = 0;
  let sleighCooldown = 0;
  let snowmanClock = 0;

  const upgrades = [
    {id:'atk',type:'기본 능력 강화',icon:'⚔️',name:'산타의 힘',desc:'기본 공격력과 직접 공격 피해가 20% 증가한다.',apply(){attackPower*=1.2}},
    {id:'hp',type:'기본 능력 강화',icon:'❤️',name:'튼튼한 산타복',desc:'최대 체력이 25% 증가하고 증가한 만큼 즉시 회복한다.',apply(){const old=maxHp;maxHp*=1.25;hp=Math.min(maxHp,hp+(maxHp-old))}},
    {id:'speed',type:'기본 능력 강화',icon:'💨',name:'눈길 질주',desc:'이동속도가 12% 증가한다.',apply(){if(typeof speedBonus==='number')speedBonus+=30;else santa.speed*=1.12}},
    {id:'regen',type:'기본 능력 강화',icon:'💚',name:'따뜻한 코코아',desc:'5초마다 최대 체력의 4%를 회복한다.',apply(){regenRate+=.04}},
    {id:'defense',type:'기본 능력 강화',icon:'🛡️',name:'산타 방어막',desc:'방어력 50을 획득한다. 피해는 체력보다 방어력이 먼저 받고, 10초마다 방어력이 전부 회복된다.',apply(){defenseMax+=50;defenseNow=defenseMax;defenseRechargeClock=0}},
    {id:'giftPower',type:'선물상자 강화',icon:'🎁',name:'고급 포장',desc:'모든 선물상자 스킬 피해가 25% 증가한다.',apply(){giftPowerMult*=1.25}},
    {id:'giftCd',type:'선물상자 강화',icon:'⏱️',name:'빠른 포장',desc:'선물상자 스킬 재사용 대기시간이 12% 감소한다.',apply(){cooldownMult=Math.max(.25,cooldownMult*.88)}},
    {id:'snowShot',type:'상시 발동 스킬',icon:'❄️',name:'자동 눈덩이',desc:'1.4초마다 가장 가까운 적에게 강한 눈덩이를 자동 발사한다.',apply(){}},
    {id:'lightning',type:'상시 발동 스킬',icon:'⚡',name:'크리스마스 번개',desc:'3초마다 가까운 적 최대 3명을 자동 공격한다.',apply(){}},
    {id:'aura',type:'상시 발동 스킬',icon:'🌟',name:'별빛 오라',desc:'산타 주변의 적에게 계속 피해를 준다.',apply(){}},
    {id:'drone',type:'상시 발동 스킬',icon:'🧸',name:'장난감 드론',desc:'드론이 산타를 따라다니며 0.8초마다 자동 사격한다.',apply(){}},
    {id:'sleigh',type:'상시 발동 스킬',icon:'🛷',name:'순록 썰매',desc:'체력이 10% 이하가 되면 체력을 회복하고 화면의 모든 적을 제거한다. Lv.1은 10% 회복, 레벨마다 회복량 +10%. 쿨타임 20초.',apply(){}},
    {id:'snowmanSummon',type:'상시 발동 스킬',icon:'⛄',name:'눈사람 소환',desc:'약한 투사체를 던지는 눈사람 1개를 소환한다. 레벨업할 때마다 눈사람이 1개 더 늘어난다.',apply(){}}
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
    Object.entries(runSkills).filter(([,v])=>v>0).slice(-8).forEach(([id,v])=>{
      const u=upgrades.find(q=>q.id===id);if(!u)return;
      const d=document.createElement('div');d.className='runSkillChip';d.textContent=`${u.icon}${v>1?' '+v:''}`;root.appendChild(d);
    });
  }
  function choices(){const pool=[...upgrades],out=[];while(out.length<3&&pool.length){const i=Math.floor(Math.random()*pool.length);out.push(pool.splice(i,1)[0])}return out}
  function showSelect(){
    if(selectingSkill||!running)return;
    selectingSkill=true;
    window.__skillSelecting=true;
    const sub=document.querySelector('.skillSelectSub');
    if(sub) sub.textContent=`이번 판에서만 유지 · 현재 ${skillChoiceInterval(wave)}웨이브마다 선택 (30웨이브마다 간격 +2)`;
    const root=document.getElementById('skillCards');root.innerHTML='';
    choices().forEach(u=>{
      const btn=document.createElement('button');btn.className='skillCard';
      btn.innerHTML=`<div class="skillCardHead">${u.type}</div><div class="skillCardIcon">${u.icon}</div><div class="skillCardName">${u.name}</div><div class="skillCardDesc">${u.desc}</div><div class="skillType">${u.type}</div><div class="skillOwned">보유 Lv.${count(u.id)}</div>`;
      btn.onclick=()=>{
        runSkills[u.id]=count(u.id)+1;
        u.apply();
        selectingSkill=false;
        window.__skillSelecting=false;
        document.getElementById('skillSelect').style.display='none';
        renderBar();
        if(typeof showToast==='function')showToast(`${u.icon} ${u.name} Lv.${count(u.id)}`)
      };
      root.appendChild(btn);
    });
    document.getElementById('skillSelect').style.display='flex';
  }

  const oldGiftDmg=typeof giftDmg==='function'?giftDmg:null;
  if(oldGiftDmg){giftDmg=function(mult){return Math.round(oldGiftDmg(mult)*giftPowerMult)}}

  const oldReset=reset;
  reset=function(){
    oldReset();
    selectingSkill=false;window.__skillSelecting=false;lastSkillChoiceWave=1;passiveClock=0;regenRate=0;giftPowerMult=1;runSkills={};
    defenseMax=0;defenseNow=0;defenseRechargeClock=0;sleighCooldown=0;snowmanClock=0;
    const sel=document.getElementById('skillSelect');if(sel)sel.style.display='none';renderBar();
  };

  function triggerSleigh(){
    const lv=count('sleigh');
    if(!lv || sleighCooldown>0 || hp>maxHp*.10) return;
    const healRatio=Math.min(.10*lv,.60);
    hp=Math.min(maxHp,hp+maxHp*healRatio);
    for(const e of enemies)e.hp=0;
    enemies=[];
    sleighCooldown=20;
    if(typeof ringFx==='function')ringFx(santa.x,santa.y,'#ffef8a',1.1);
    if(typeof burst==='function')burst(santa.x,santa.y,60,'#ffef8a');
    const ev=document.getElementById('event');if(ev)ev.textContent=`🛷 순록 썰매! 체력 ${Math.round(healRatio*100)}% 회복 + 적 전멸`;
    if(typeof showToast==='function')showToast(`🛷 순록 썰매 발동! +${Math.round(healRatio*100)}% 회복`);
  }

  function snowmanPassive(dt){
    const lv=count('snowmanSummon');
    if(!lv)return;
    snowmanClock+=dt;
    if(snowmanClock>=1.5){
      snowmanClock=0;
      for(let i=0;i<lv;i++){
        const tg=nearest(santa);if(!tg)break;
        const a=(Math.PI*2/lv)*i+passiveClock*.8;
        const from={x:santa.x+Math.cos(a)*52,y:santa.y+Math.sin(a)*52};
        shoot(from,tg,Math.max(4,Math.round(attackPower*.42)),430,'snowman');
      }
    }
  }

  function passive(dt){
    passiveClock+=dt;
    if(sleighCooldown>0)sleighCooldown=Math.max(0,sleighCooldown-dt);
    if(defenseMax>0){
      defenseRechargeClock+=dt;
      if(defenseRechargeClock>=10){defenseRechargeClock=0;defenseNow=defenseMax;if(typeof showToast==='function')showToast(`🛡️ 방어력 ${defenseMax} 전부 회복`)}
    }
    const snowLv=count('snowShot'),lightLv=count('lightning'),auraLv=count('aura'),droneLv=count('drone');
    if(snowLv && passiveClock%1.4<dt){const tg=nearest(santa);if(tg){shoot(santa,tg,Math.round(attackPower*(1.2+.35*snowLv)),560,'snow');if(typeof ringFx==='function')ringFx(santa.x,santa.y,'#a9efff',.25)}}
    if(lightLv && passiveClock%3<dt){const arr=[...enemies].sort((a,b)=>dist(santa,a)-dist(santa,b)).slice(0,Math.min(2+lightLv,6));for(const e of arr){e.hp-=attackPower*(1.5+.4*lightLv);if(typeof ringFx==='function')ringFx(e.x,e.y,'#ffe95c',.28)}}
    if(auraLv){for(const e of enemies)if(dist(santa,e)<95+auraLv*8)e.hp-=attackPower*(.85+.18*auraLv)*dt}
    if(droneLv && passiveClock%.8<dt){const tg=nearest(santa);if(tg){const a=passiveClock*3;shoot({x:santa.x+Math.cos(a)*38,y:santa.y+Math.sin(a)*38},tg,Math.round(attackPower*(.65+.18*droneLv)),520,'drone')}}
    if(regenRate>0 && passiveClock%5<dt)hp=Math.min(maxHp,hp+maxHp*regenRate);
    snowmanPassive(dt);
  }

  const oldUpdate=update;
  update=function(dt){
    if(selectingSkill)return;

    const realHpBefore=hp;
    const virtualBuffer=defenseNow + (count('sleigh')&&sleighCooldown<=0 ? maxHp*100 : 0);
    if(virtualBuffer>0)hp=realHpBefore+virtualBuffer;

    oldUpdate(dt);

    if(virtualBuffer>0 && running){
      const rawDamage=Math.max(0,(realHpBefore+virtualBuffer)-hp);
      let remaining=rawDamage;
      if(defenseNow>0 && remaining>0){
        const blocked=Math.min(defenseNow,remaining);
        defenseNow-=blocked;
        remaining-=blocked;
      }
      hp=Math.max(0,realHpBefore-remaining);
    }

    if(!running)return;
    passive(dt);
    triggerSleigh();

    if(hp<=0){
      hp=0;
      if(typeof finishRun==='function')finishRun();
      return;
    }

    const hpEl=document.getElementById('hp');if(hpEl)hpEl.style.width=Math.max(0,hp/maxHp*100)+'%';
    if(isSkillChoiceWave(wave) && wave!==lastSkillChoiceWave){lastSkillChoiceWave=wave;showSelect()}
  };

  const oldDraw=draw;
  draw=function(){
    oldDraw();
    x.save();
    if(count('aura')){x.strokeStyle='rgba(255,244,120,.46)';x.lineWidth=4;x.shadowColor='#fff38b';x.shadowBlur=10;x.beginPath();x.arc(santa.x,santa.y,95+count('aura')*8,0,Math.PI*2);x.stroke();x.shadowBlur=0}
    if(count('drone')){const a=passiveClock*3,dx=santa.x+Math.cos(a)*38,dy=santa.y+Math.sin(a)*38;x.font='22px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🧸',dx,dy)}
    const snowmen=count('snowmanSummon');
    if(snowmen){for(let i=0;i<snowmen;i++){const a=(Math.PI*2/snowmen)*i+passiveClock*.8,dx=santa.x+Math.cos(a)*52,dy=santa.y+Math.sin(a)*52;x.font='24px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('⛄',dx,dy)}}
    if(defenseMax>0){
      const ratio=Math.max(0,defenseNow/defenseMax);
      x.strokeStyle=`rgba(105,220,255,${.25+.65*ratio})`;x.lineWidth=4;x.beginPath();x.arc(santa.x,santa.y,santa.r+22,0,Math.PI*2);x.stroke();
      x.font='11px sans-serif';x.textAlign='center';x.fillStyle='#bff4ff';x.fillText(`🛡️ ${Math.ceil(defenseNow)}/${defenseMax}`,santa.x,santa.y-42);
    }
    if(count('sleigh')){x.font='11px sans-serif';x.textAlign='center';x.fillStyle='#fff0a8';x.fillText(sleighCooldown>0?`🛷 ${sleighCooldown.toFixed(1)}s`:'🛷 READY',santa.x,santa.y+48)}
    x.restore();
  };
})();