  const MAX = 20,
    WIN = 500;
  let charm = false,
    gold = 0,
    opened = 0,
    over = false,
    chartI = null;
  let ct = {
    gold: 0,
    rare: 0,
    trap: 0,
    monster: 0,
    bomb: 0
  };

  const OUT = {
    base: [
      ['gold', .45],
      ['rare', .10],
      ['trap', .25],
      ['monster', .15],
      ['bomb', .05]
    ],
    charm: [
      ['gold', .40],
      ['rare', .25],
      ['trap', .20],
      ['monster', .10],
      ['bomb', .05]
    ]
  };
  const ICONS = {
    gold: '💰',
    rare: '💎',
    trap: '💀',
    monster: '👹',
    bomb: '💣'
  };
  const LABELS = {
    gold: 'Gold Found!',
    rare: 'Rare Item!',
    trap: 'Trap!',
    monster: 'Monster Defeated!',
    bomb: '💥 BOMB HIT!'
  };
  const RW = {
    gold: 30,
    rare: 100,
    trap: -20,
    monster: 30,
    bomb: -500
  };
  const CLR = {
    gold: '#BA7517',
    rare: '#534AB7',
    trap: '#A32D2D',
    monster: '#0F6E56',
    bomb: '#C2410C'
  };
  const BGS = {
    gold: '#FAEEDA',
    rare: '#EEEDFE',
    trap: '#FCEBEB',
    monster: '#E1F5EE',
    bomb: '#FEF3C7'
  };
  const TXT = {
    gold: '#633806',
    rare: '#3C3489',
    trap: '#791F1F',
    monster: '#085041',
    bomb: '#92400E'
  };

  function roll(p) {
    let r = Math.random(),
      c = 0;
    for (const [k, v] of p) {
      c += v;
      if (r < c) return k;
    }
    return p.at(-1)[0];
  }

  function evCalc(p) {
    return p.reduce((s, [k, v]) => s + v * RW[k], 0);
  }

  function updateEV() {
    const e = evCalc(charm ? OUT.charm : OUT.base);
    const t = e * MAX;
    const e1 = document.getElementById('evOne');
    const e2 = document.getElementById('evAll');
    e1.textContent = (e >= 0 ? '+' : '') + e.toFixed(1);
    e1.className = e >= 0 ? 'g' : 'r';
    e2.textContent = (t >= 0 ? '+' : '') + t.toFixed(1);
    e2.className = t >= 0 ? 'g' : 'r';
  }

  function toggleCharm() {
    if (over) return;
    charm = !charm;
    const b = document.getElementById('charmBtn');
    b.classList.toggle('on', charm);
    b.setAttribute('aria-pressed', charm);
    updateEV();
  }

  function flashReward(val) {
    const el = document.getElementById('rewardFlash');
    el.style.display = 'block';
    el.style.opacity = '1';
    el.style.top = '38%';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.textContent = (val >= 0 ? '+' : '') + val + ' gold';
    el.style.color = val >= 0 ? '#3B6D11' : '#A32D2D';
    el.style.fontSize = '20px';
    el.style.fontWeight = '500';
    el.style.position = 'absolute';
    el.style.animation = 'floatup .9s ease forwards';
    setTimeout(() => {
      el.style.display = 'none';
    }, 950);
  }

  function openChest() {
    if (over) return;
    const probs = charm ? OUT.charm : OUT.base;
    const outcome = roll(probs);
    const rw = RW[outcome];
    ct[outcome]++;
    gold = Math.max(0, gold + rw);
    opened++;

    const ic = document.getElementById('aIcon');
    ic.textContent = ICONS[outcome];
    ic.classList.remove('pop', 'bomb-shake');
    void ic.offsetWidth;
    ic.classList.add(outcome === 'bomb' ? 'bomb-shake' : 'pop');

    flashReward(rw);

    document.getElementById('aLabel').textContent = LABELS[outcome];
    const rem = MAX - opened,
      need = Math.max(0, WIN - gold);
    document.getElementById('aSub').textContent =
      (rw >= 0 ? '+' : '') + rw + ' coins · ' + rem + ' rounds left · need ' + need + ' gold';

    document.getElementById('mGold').textContent = gold.toLocaleString();
    document.getElementById('mRare').textContent = ct.rare;
    document.getElementById('mTrap').textContent = ct.trap;
    document.getElementById('mMon').textContent = ct.monster;
    document.getElementById('mBomb').textContent = ct.bomb;
    document.getElementById('bombStat').classList.toggle('danger', ct.bomb > 0);
    document.getElementById('rDisp').textContent = opened + '/' + MAX;

    const pct = (opened / MAX) * 100;
    const bar = document.getElementById('pBar');
    bar.style.width = pct + '%';
    bar.classList.toggle('risk', rem <= 5 && gold < WIN);
    bar.classList.toggle('done', gold >= WIN);
    document.getElementById('pLeft').textContent = rem + ' rounds left';
    document.getElementById('pNeed').textContent = 'Need ' + need + ' more gold';

    spawnParticles(outcome);

    if (gold >= WIN) endGame(true);
    else if (opened >= MAX) endGame(false);
  }

  function endGame(win) {
    over = true;
    document.getElementById('openBtn').disabled = true;
    document.getElementById('charmBtn').disabled = true;
    document.getElementById('rstBtn').style.display = '';
    const box = document.getElementById('outBox');
    box.className = 'outcome-box ' + (win ? 'win' : 'lose');
    box.style.display = 'block';
    document.getElementById('outIcon').textContent = win ? '🏆' : '💔';
    document.getElementById('outTitle').textContent = win ? 'Victory!' : 'Defeat';
    document.getElementById('outDesc').textContent = win ?
      'Collected ' + gold.toLocaleString() + ' gold in ' + opened + ' rounds!' :
      'Only ' + gold.toLocaleString() + '/' + WIN + ' gold after ' + MAX + ' rounds.';
  }

  function resetGame() {
    charm = false;
    gold = 0;
    opened = 0;
    over = false;
    ct = {
      gold: 0,
      rare: 0,
      trap: 0,
      monster: 0,
      bomb: 0
    };
    ['openBtn', 'charmBtn'].forEach(id => {
      document.getElementById(id).disabled = false;
    });
    const cb = document.getElementById('charmBtn');
    cb.classList.remove('on');
    cb.setAttribute('aria-pressed', false);
    document.getElementById('rstBtn').style.display = 'none';
    document.getElementById('outBox').style.display = 'none';
    ['mGold', 'mRare', 'mTrap', 'mMon', 'mBomb'].forEach(id => {
      document.getElementById(id).textContent = '0';
    });
    document.getElementById('bombStat').classList.remove('danger');
    document.getElementById('rDisp').textContent = '0/' + MAX;
    const bar = document.getElementById('pBar');
    bar.style.width = '0%';
    bar.className = 'prog-fill';
    document.getElementById('pLeft').textContent = MAX + ' rounds left';
    document.getElementById('pNeed').textContent = 'Need ' + WIN + ' gold to win';
    document.getElementById('aIcon').textContent = '🎁';
    document.getElementById('aLabel').textContent = 'Open a chest to begin!';
    document.getElementById('aSub').textContent = 'Base EV is −2 coins — use Lucky Charm to flip it positive';
    updateEV();
    particles = [];
  }

  function showProbs() {
    const sec = document.getElementById('simWrap');
    sec.style.display = 'block';
    const pt = document.getElementById('probTable');
    const rows = [
      ['💰 Gold', '45%', '40%', '+30', '+13.5', '+12.0', '#FAEEDA', '#633806'],
      ['💎 Rare', '10%', '25%', '+100', '+10.0', '+25.0', '#EEEDFE', '#3C3489'],
      ['💀 Trap', '25%', '20%', '−20', '−5.0', '−4.0', '#FCEBEB', '#791F1F'],
      ['👹 Monster', '15%', '10%', '+30', '+4.5', '+3.0', '#E1F5EE', '#085041'],
      ['💣 Bomb', '5%', '5%', '−500', '−25.0', '−25.0', '#FEF3C7', '#92400E'],
    ];
    pt.innerHTML = `<table class="prob-table"><thead><tr>
    <th>Outcome</th><th>Base P</th><th>+Charm</th><th>Reward</th><th>EV base</th><th>EV charm</th>
  </tr></thead><tbody>${rows.map(([n,bp,cp,r,e1,e2,bg,tc])=>`<tr>
    <td><span class="pill" style="background:${bg};color:${tc}">${n}</span></td>
    <td>${bp}</td><td>${cp}</td><td>${r}</td>
    <td class="${parseFloat(e1)>=0?'g':'r'}">${e1}</td>
    <td class="${parseFloat(e2)>=0?'g':'r'}">${e2}</td>
  </tr>`).join('')}</tbody>
  <tfoot><tr style="font-weight:500"><td colspan="4">Total EV</td><td class="r">−2.0</td><td class="g">+11.0</td></tr></tfoot>
  </table>`;
  }

  function runSim() {
    const probs = charm ? OUT.charm : OUT.base;
    const sc = {
      gold: 0,
      rare: 0,
      trap: 0,
      monster: 0,
      bomb: 0
    };
    for (let i = 0; i < 10000; i++) sc[roll(probs)]++;
    const sec = document.getElementById('simWrap');
    sec.style.display = 'block';
    document.getElementById('simNote').textContent =
      (charm ? 'Lucky Charm active' : 'No Lucky Charm') + ' · 10,000 iterations';
    const keys = ['gold', 'rare', 'trap', 'monster', 'bomb'];
    const bd = document.getElementById('lootBars');
    bd.innerHTML = '';
    for (const k of keys) {
      const pct = (sc[k] / 100).toFixed(1);
      const ev = (sc[k] / 10000 * RW[k]).toFixed(1);
      bd.innerHTML += `<div class="lrow">
      <span class="ln">${ICONS[k]} ${k[0].toUpperCase()+k.slice(1)}</span>
      <div class="lbg"><div class="lbf" style="width:${pct}%;background:${CLR[k]}"></div></div>
      <span class="lp">${pct}%</span>
      <span class="lev ${parseFloat(ev)>=0?'g':'r'}">${parseFloat(ev)>=0?'+':''}${ev}</span>
    </div>`;
    }
    document.getElementById('chartWrap').style.display = 'block';
    if (chartI) chartI.destroy();
    chartI = new Chart(document.getElementById('lootChart'), {
      type: 'bar',
      data: {
        labels: ['💰 Gold', '💎 Rare', '💀 Trap', '👹 Monster', '💣 Bomb'],
        datasets: [{
          label: 'Count',
          data: keys.map(k => sc[k]),
          backgroundColor: keys.map(k => CLR[k]),
          borderRadius: 5,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.parsed.y.toLocaleString()} (${(ctx.parsed.y/100).toFixed(1)}%)`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: 11
              }
            },
            grid: {
              display: false
            }
          },
          y: {
            ticks: {
              callback: v => v.toLocaleString()
            },
            grid: {
              color: 'rgba(128,128,128,0.1)'
            }
          }
        }
      }
    });
  }

  const canvas = document.getElementById('canvas-bg');
  const ctx2 = canvas.getContext('2d');
  let particles = [];
  let animId = null;

  function resizeCanvas() {
    const shell = canvas.parentElement;
    canvas.width = shell.offsetWidth;
    canvas.height = shell.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const PARTICLE_COLORS = {
    gold: ['#EF9F27', '#BA7517', '#FAC775', '#FAEEDA'],
    rare: ['#534AB7', '#7F77DD', '#AFA9EC', '#EEEDFE'],
    trap: ['#A32D2D', '#E24B4A', '#F09595'],
    monster: ['#0F6E56', '#1D9E75', '#5DCAA5'],
    bomb: ['#C2410C', '#E24B4A', '#F09595', '#888780']
  };

  function spawnParticles(outcome) {
    const colors = PARTICLE_COLORS[outcome] || PARTICLE_COLORS.gold;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.38;
    const count = outcome === 'bomb' ? 40 : outcome === 'rare' ? 30 : 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (outcome === 'bomb' ? 4 : 2.5) + Math.random() * (outcome === 'bomb' ? 4 : 2.5);
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (outcome === 'bomb' ? 3 : 1.5),
        r: (outcome === 'bomb' ? 4 : 3) + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: .018 + Math.random() * .015,
        shape: outcome === 'rare' ? 'diamond' : outcome === 'bomb' ? 'square' : 'circle'
      });
    }
    if (!animId) animLoop();
  }

  function animLoop() {
    ctx2.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      ctx2.save();
      ctx2.globalAlpha = p.life;
      ctx2.fillStyle = p.color;
      ctx2.beginPath();
      if (p.shape === 'diamond') {
        ctx2.translate(p.x, p.y);
        ctx2.rotate(Math.PI / 4);
        ctx2.rect(-p.r, -p.r, p.r * 2, p.r * 2);
      } else if (p.shape === 'square') {
        ctx2.rect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      } else {
        ctx2.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx2.fill();
      ctx2.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += .12;
      p.life -= p.decay;
    }
    if (particles.length > 0) {
      animId = requestAnimationFrame(animLoop);
    } else {
      animId = null;
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  updateEV();