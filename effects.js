// Visual skill effects overlay for SANTA: INFINITE NIGHT
(() => {
  if (typeof useGift !== 'function' || typeof draw !== 'function' || typeof update !== 'function') return;

  const oldDraw = draw;
  const oldUpdate = update;
  let banner = '';
  let bannerLife = 0;
  let flashLife = 0;

  function addRing(px, py, color = '#ffdf61', life = 0.65) {
    fx.push({ ring: true, x: px, y: py, life, max: life, color });
  }
  function addBurst(px, py, n = 20, color = '#ffcf4c') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 180;
      fx.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.35 + Math.random() * 0.65, max: 1, color });
    }
  }
  function announce(text, color) {
    banner = text;
    bannerLife = 0.9;
    flashLife = 0.14;
    addRing(santa.x, santa.y, color, 0.5);
  }

  useGift = function () {
    const cd = cooldownBase * cooldownMult;
    if (!running || t - lastGift < cd) return;
    lastGift = t;
    const r = Math.floor(Math.random() * 10);
    const tg = nearest(santa);

    if (r === 0) {
      document.getElementById('event').textContent = '💥 폭발 선물!';
      const px = tg ? tg.x : santa.x, py = tg ? tg.y : santa.y - 120;
      announce('💥 폭발 선물', '#ffd661'); addRing(px, py, '#ffd661', 0.75); addBurst(px, py, 34, '#ffd661');
      for (const e of enemies) if (Math.hypot(e.x - px, e.y - py) < 150) e.hp -= giftDmg(4.2);
    } else if (r === 1) {
      document.getElementById('event').textContent = '🧒 아이 소환!';
      announce('🧒 아이 소환', '#55c7ff'); addBurst(santa.x, santa.y, 20, '#55c7ff');
      kids.push({ x: santa.x, y: santa.y, life: 14, last: 0, type: 'kid', ang: Math.random() * Math.PI * 2 });
    } else if (r === 2) {
      document.getElementById('event').textContent = '🌧️ 총알비!';
      announce('🌧️ 총알비', '#ffe55f');
      for (let i = 0; i < 36; i++) bullets.push({ x: rand(0, W), y: -20 - rand(0, 180), vx: rand(-25, 25), vy: rand(420, 620), r: 4, dmg: giftDmg(1.6), life: 2.5, kind: 'rain' });
    } else if (r === 3) {
      document.getElementById('event').textContent = '👊 근접 난타!';
      announce('👊 근접 난타', '#fff58f'); addRing(santa.x, santa.y, '#fff58f', 0.45); addBurst(santa.x, santa.y, 28, '#fff58f');
      for (const e of enemies) if (dist(santa, e) < 125) e.hp -= giftDmg(5);
    } else if (r === 4) {
      document.getElementById('event').textContent = '❄️ 눈보라!';
      announce('❄️ 눈보라', '#b7efff'); addRing(santa.x, santa.y, '#b7efff', 1);
      for (let i = 0; i < 60; i++) fx.push({ x: rand(0, W), y: rand(0, H), vx: rand(-35, 35), vy: rand(25, 90), life: rand(0.6, 1.3), max: 1, color: '#dff7ff', snowflake: true });
      for (const e of enemies) { e.hp -= giftDmg(2); e.spd *= 0.5; }
    } else if (r === 5) {
      document.getElementById('event').textContent = '🦌 순록 돌진!';
      announce('🦌 순록 돌진', '#ffdd8a');
      const a = tg ? Math.atan2(tg.y - santa.y, tg.x - santa.x) : -Math.PI / 2;
      for (let d = 35; d < 390; d += 42) { const px = santa.x + Math.cos(a) * d, py = santa.y + Math.sin(a) * d; addRing(px, py, '#ffdd8a', 0.38); }
      for (const e of enemies) if (dist(santa, e) < 230) e.hp -= giftDmg(2.5);
    } else if (r === 6) {
      document.getElementById('event').textContent = '🎁💣 거대 선물폭탄!';
      announce('🎁💣 거대 선물폭탄', '#ff89d8'); addRing(W / 2, H * 0.45, '#ff89d8', 1.05); addBurst(W / 2, H * 0.45, 70, '#ff76bf');
      for (const e of enemies) e.hp -= giftDmg(6);
    } else if (r === 7) {
      document.getElementById('event').textContent = '🛡️ 보호막!';
      announce('🛡️ 보호막', '#79ecff'); shield = 8; addRing(santa.x, santa.y, '#79ecff', 0.8);
    } else if (r === 8) {
      document.getElementById('event').textContent = '🍬 사탕 지뢰!';
      announce('🍬 사탕 지뢰', '#ff9ce4'); addBurst(santa.x, santa.y, 18, '#ff9ce4');
      for (let i = 0; i < 6; i++) mines.push({ x: santa.x + rand(-140, 140), y: santa.y + rand(-140, 140), r: 13, life: 12 });
    } else {
      document.getElementById('event').textContent = '🧝 엘프 지원!';
      announce('🧝 엘프 지원', '#67f0a3'); addBurst(santa.x, santa.y, 20, '#67f0a3');
      kids.push({ x: santa.x, y: santa.y, life: 16, last: 0, type: 'elf', ang: Math.random() * Math.PI * 2 });
    }
  };

  update = function (dt) {
    oldUpdate(dt);
    if (bannerLife > 0) bannerLife -= dt;
    if (flashLife > 0) flashLife -= dt;
    for (const f of fx) {
      f.life -= dt;
      if (!f.ring) { f.x += (f.vx || 0) * dt; f.y += (f.vy || 0) * dt; f.vx = (f.vx || 0) * 0.96; f.vy = (f.vy || 0) * 0.96; }
    }
    fx = fx.filter(f => f.life > 0);
  };

  draw = function () {
    oldDraw();
    x.save();
    for (const k of kids) {
      x.globalAlpha = 1; circle(k.x, k.y, 15, k.type === 'elf' ? '#57e389' : '#55c7ff');
      x.font = '20px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(k.type === 'elf' ? '🧝' : '🧒', k.x, k.y);
    }
    for (const f of fx) {
      const a = Math.max(0, f.life / (f.max || 1)); x.globalAlpha = Math.min(1, a);
      if (f.ring) {
        x.strokeStyle = f.color || '#ffdf61'; x.lineWidth = 9; x.shadowColor = f.color || '#ffdf61'; x.shadowBlur = 18;
        x.beginPath(); x.arc(f.x, f.y, (1 - a) * 170 + 18, 0, Math.PI * 2); x.stroke(); x.shadowBlur = 0;
      } else if (f.snowflake) {
        x.font = '18px sans-serif'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText('❄️', f.x, f.y);
      } else circle(f.x, f.y, 4, f.color || '#ffcf4c');
    }
    x.globalAlpha = 1;
    if (shield > 0) { x.strokeStyle = 'rgba(120,220,255,.95)'; x.lineWidth = 5; x.shadowColor = '#79ecff'; x.shadowBlur = 15; x.beginPath(); x.arc(santa.x, santa.y, santa.r + 16, 0, Math.PI * 2); x.stroke(); x.shadowBlur = 0; }
    if (bannerLife > 0) {
      x.globalAlpha = Math.min(1, bannerLife * 2); x.font = '900 27px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.7)'; x.strokeText(banner, W / 2, H * 0.25); x.fillStyle = '#fff'; x.fillText(banner, W / 2, H * 0.25);
    }
    if (flashLife > 0) { x.globalAlpha = Math.min(0.18, flashLife); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); }
    x.restore();
  };
})();
