(() => {
  if (typeof spawn !== 'function' || typeof update !== 'function' || typeof draw !== 'function' || typeof useGift !== 'function') return;

  let enemyShots = [];
  let mutantClock = 0;
  let mutationNoticeTier = 0;

  function mutantTier(){ return Math.max(0, Math.floor(wave / 40)); }
  function edgeSpawn(e){
    const s=Math.floor(Math.random()*4);
    if(s===0){e.x=rand(0,W);e.y=-35}
    else if(s===1){e.x=W+35;e.y=rand(50,H-110)}
    else if(s===2){e.x=rand(0,W);e.y=H+35}
    else {e.x=-35;e.y=rand(50,H-110)}
  }
  function makeMutant(){
    const tier=mutantTier();
    const unlocked=['ranged'];
    if(tier>=2) unlocked.push('bomber');
    if(tier>=3) unlocked.push('plasma');
    const type=choice(unlocked);
    const base=42+wave*4.2;
    const e={x:0,y:0,r:22,hp:base,maxHp:base,spd:0,damage:20+wave*.45,boss:false,mutant:true,mutantType:type,lastMutant:0};
    if(type==='ranged'){
      e.emoji='🧙'; e.hp=base*1.35; e.maxHp=e.hp; e.spd=0; e.damage=12+wave*.24;
    } else if(type==='bomber'){
      e.emoji='🤖'; e.hp=base*1.8; e.maxHp=e.hp; e.spd=52+wave*.9; e.damage=0; e.bombed=false;
    } else {
      e.emoji='👾'; e.hp=base*2.1; e.maxHp=e.hp; e.spd=0; e.damage=16+wave*.28;
    }
    edgeSpawn(e); return e;
  }

  const oldSpawn=spawn;
  spawn=function(){
    const tier=mutantTier();
    if(tier>0){
      const chance=Math.min(.08+tier*.035,.28);
      if(Math.random()<chance){enemies.push(makeMutant());return;}
    }
    oldSpawn();
  };

  function shootEnemy(e,speed=210,damage=e.damage,color='#ff6a6a',r=6){
    const a=Math.atan2(santa.y-e.y,santa.x-e.x);
    enemyShots.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage,color,r,life:5});
  }
  function mutantExplosion(e){
    if(typeof ringFx==='function') ringFx(e.x,e.y,'#ff814a',.75);
    if(typeof burst==='function') burst(e.x,e.y,34,'#ff814a');
    const d=Math.hypot(santa.x-e.x,santa.y-e.y);
    if(d<145 && shield<=0) hp-=Math.max(18,32+wave*.7);
    e.hp=0;
  }

  const oldUpdate=update;
  update=function(dt){
    oldUpdate(dt);
    if(!running) return;
    mutantClock+=dt;
    const tier=mutantTier();
    if(tier>mutationNoticeTier){
      mutationNoticeTier=tier;
      if(typeof showToast==='function') showToast(`🧬 변이 적 단계 ${tier} 출현!`);
      const ev=document.getElementById('event'); if(ev) ev.textContent=`🧬 변이 적 단계 ${tier} 활성화`;
    }
    for(const e of enemies){
      if(!e.mutant || e.hp<=0) continue;
      const d=Math.hypot(santa.x-e.x,santa.y-e.y);
      e.lastMutant=(e.lastMutant||0)+dt;
      if(e.mutantType==='ranged'){
        // 원거리 적은 적정 거리를 유지하며 얼음탄 발사
        if(d>270){const a=Math.atan2(santa.y-e.y,santa.x-e.x);e.x+=Math.cos(a)*42*dt;e.y+=Math.sin(a)*42*dt;}
        else if(d<180){const a=Math.atan2(e.y-santa.y,e.x-santa.x);e.x+=Math.cos(a)*55*dt;e.y+=Math.sin(a)*55*dt;}
        if(e.lastMutant>1.8){e.lastMutant=0;shootEnemy(e,225,e.damage,'#72d9ff',6);}
      } else if(e.mutantType==='bomber'){
        if(!e.bombed && d<92){e.bombed=true;mutantExplosion(e);}
      } else if(e.mutantType==='plasma'){
        if(d>300){const a=Math.atan2(santa.y-e.y,santa.x-e.x);e.x+=Math.cos(a)*36*dt;e.y+=Math.sin(a)*36*dt;}
        if(e.lastMutant>1.25){e.lastMutant=0;for(let q=-1;q<=1;q++){
          const a=Math.atan2(santa.y-e.y,santa.x-e.x)+q*.18;
          enemyShots.push({x:e.x,y:e.y,vx:Math.cos(a)*245,vy:Math.sin(a)*245,damage:e.damage,color:'#c66cff',r:7,life:5});
        }}
      }
    }
    for(const p of enemyShots){
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
      if(Math.hypot(p.x-santa.x,p.y-santa.y)<p.r+santa.r){
        if(shield<=0) hp-=p.damage; p.life=0;
        if(typeof ringFx==='function') ringFx(p.x,p.y,p.color,.24);
      }
    }
    enemyShots=enemyShots.filter(p=>p.life>0&&p.x>-50&&p.x<W+50&&p.y>-50&&p.y<H+50);
  };

  const oldDraw=draw;
  draw=function(){
    oldDraw();
    x.save();
    for(const e of enemies){
      if(!e.mutant) continue;
      // 기존 👹 표시를 덮고 변이 이모티콘 표시
      circle(e.x,e.y,e.r+4,e.mutantType==='ranged'?'#183f59':e.mutantType==='bomber'?'#5a2917':'#3b1857');
      x.font=(e.r*1.7)+'px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.fillText(e.emoji,e.x,e.y);
      x.font='11px sans-serif';x.fillStyle='#fff';x.fillText('변이',e.x,e.y-e.r-9);
    }
    for(const p of enemyShots){
      x.shadowColor=p.color;x.shadowBlur=12;circle(p.x,p.y,p.r,p.color);x.shadowBlur=0;
    }
    x.restore();
  };

  // 기존 10종에 새로운 선물상자 스킬 4종을 추가한다.
  const baseGift=useGift;
  useGift=function(){
    const cd=cooldownBase*cooldownMult;
    if(!running||t-lastGift<cd)return;
    // 약 29% 확률로 신규 스킬, 나머지는 기존 선물 스킬 사용
    if(Math.random()>=.29){baseGift();return;}
    lastGift=t;
    const r=Math.floor(Math.random()*4);
    if(r===0){
      const ev=document.getElementById('event');if(ev)ev.textContent='🎄 크리스마스 레이저!';
      const tg=nearest(santa);const a=tg?Math.atan2(tg.y-santa.y,tg.x-santa.x):-Math.PI/2;
      for(let d=20;d<520;d+=24){const px=santa.x+Math.cos(a)*d,py=santa.y+Math.sin(a)*d;if(typeof ringFx==='function')ringFx(px,py,'#65ff75',.22);for(const e of enemies)if(Math.hypot(e.x-px,e.y-py)<38)e.hp-=giftDmg(.62)}
    } else if(r===1){
      const ev=document.getElementById('event');if(ev)ev.textContent='☄️ 별똥별 폭격!';
      for(let i=0;i<8;i++){const px=rand(40,W-40),py=rand(70,H-80);if(typeof ringFx==='function')ringFx(px,py,'#ffcf55',.55);for(const e of enemies)if(Math.hypot(e.x-px,e.y-py)<90)e.hp-=giftDmg(2.2)}
    } else if(r===2){
      const ev=document.getElementById('event');if(ev)ev.textContent='⛄ 눈사람 군단!';
      for(let i=0;i<3;i++)kids.push({x:santa.x+rand(-45,45),y:santa.y+rand(-45,45),life:18,last:0,type:'kid',ang:Math.random()*Math.PI*2});
      if(typeof ringFx==='function')ringFx(santa.x,santa.y,'#e8fbff',.8);
    } else {
      const ev=document.getElementById('event');if(ev)ev.textContent='🔔 성탄 종소리!';
      for(const e of enemies){e.hp-=giftDmg(3.1);e.spd*=.62}
      hp=Math.min(maxHp,hp+maxHp*.12);
      if(typeof ringFx==='function')ringFx(santa.x,santa.y,'#fff18b',1);
      if(typeof burst==='function')burst(santa.x,santa.y,42,'#fff18b');
    }
  };

  const oldReset=reset;
  reset=function(){oldReset();enemyShots=[];mutantClock=0;mutationNoticeTier=0;};
})();