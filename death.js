// Death result overlay: final wave reached in the current run
(() => {
  if (typeof finishRun !== 'function') return;

  const style = document.createElement('style');
  style.textContent = `
    #deathResult{position:absolute;inset:0;z-index:80;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:20px}
    #deathResult .deathPanel{width:min(90vw,420px);background:linear-gradient(180deg,#242d3a,#141a22);border:2px solid rgba(255,255,255,.14);border-radius:24px;padding:26px 20px;text-align:center;box-shadow:0 25px 70px rgba(0,0,0,.5)}
    #deathResult .deathTitle{font-size:31px;font-weight:1000;margin-bottom:12px}
    #deathResult .deathWave{font-size:18px;color:#c8d6e5;margin:5px 0}
    #deathResult .deathWave strong{display:block;font-size:48px;line-height:1.1;color:#ffd34e;margin:6px 0 12px}
    #deathResult .deathBest{font-size:14px;color:#9eb3c7;margin-bottom:18px}
    #deathResult .deathBtn{width:100%;border:0;border-radius:15px;padding:13px 16px;background:#e22b45;color:#fff;font-weight:900;font-size:17px}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'deathResult';
  overlay.innerHTML = `
    <div class="deathPanel">
      <div class="deathTitle">💀 전투 종료</div>
      <div class="deathWave">도달한 웨이브<strong id="deathWaveValue">1</strong></div>
      <div class="deathBest" id="deathBestValue">최고 기록 WAVE 1</div>
      <button class="deathBtn" id="deathHomeBtn">메인 화면</button>
    </div>`;
  document.getElementById('wrap').appendChild(overlay);

  const oldFinishRun = finishRun;
  finishRun = function(){
    const reachedWave = Math.max(1, Number(wave) || 1);
    const bestKey = 'santaBestWave';
    const oldBest = Number(localStorage.getItem(bestKey) || 0);
    const best = Math.max(oldBest, reachedWave);
    localStorage.setItem(bestKey, String(best));

    document.getElementById('deathWaveValue').textContent = reachedWave;
    document.getElementById('deathBestValue').textContent = `최고 기록 WAVE ${best}`;
    overlay.style.display = 'flex';

    oldFinishRun();
  };

  document.getElementById('deathHomeBtn').onclick = () => {
    overlay.style.display = 'none';
    const battle = document.getElementById('battleLayer');
    const lobby = document.getElementById('lobby');
    if (battle) battle.classList.add('hidden');
    if (lobby) lobby.classList.remove('hidden');
  };
})();
