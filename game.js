  let hasCharm = false;
  let counts = {
    gold: 0,
    rare: 0,
    trap: 0,
    monster: 0,
    bomb: 0
  };
  let totalGold = 0;
  let totalOpened = 0;
  let chartInst = null;

  const OUTCOMES = {
    base: [
      ['gold', 0.45],
      ['rare', 0.10],
      ['trap', 0.25],
      ['monster', 0.15],
      ['bomb', 0.05]
    ],
    charm: [
      ['gold', 0.40],
      ['rare', 0.25], 
      ['trap', 0.20],
      ['monster', 0.10],
      ['bomb', 0.05]
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
    monster: 'Monster!',
    bomb: 'Bomb!'
  };
  const SUBS = {
    gold: (r) => `+${r} coins`,
    rare: () => '+100 coins — P(Rare|Lucky Charm) = 25%',
    trap: () => '−20 coins — watch your step!',
    monster: () => '+30 coins — you defeated it!',
    bomb: () => '−500 coins — it was a bomb!'
  };
  const REWARDS = {
    gold: () => Math.floor(Math.random() * 41) + 10,
    rare: () => 100,
    trap: () => -20,
    monster: () => 30,
    bomb: () => -500
  };
  const COLORS = {
    gold: '#BA7517',
    rare: '#534AB7',
    trap: '#A32D2D',
    monster: '#0F6E56',
    bomb: '#8B0000'
  };

  function roll(probs) {
    let r = Math.random(),
      cum = 0;
    for (const [k, p] of probs) {
      cum += p;
      if (r < cum) return k;
    }
    return probs[probs.length - 1][0];
  }

  function toggleCharm() {
    hasCharm = !hasCharm;
    const btn = document.getElementById('charmBtn');
    btn.classList.toggle('active', hasCharm);
    btn.setAttribute('aria-pressed', hasCharm);
  }

  function openChest() {
    const probs = hasCharm ? OUTCOMES.charm : OUTCOMES.base;
    const outcome = roll(probs);
    const reward = REWARDS[outcome]();
    counts[outcome]++;
    totalGold += reward;
    totalOpened++;
    const icon = document.getElementById('chestIcon');
    icon.textContent = ICONS[outcome];
    icon.classList.remove('pop');
    void icon.offsetWidth;
    icon.classList.add('pop');
    document.getElementById('chestLabel').textContent = LABELS[outcome];
    document.getElementById('chestSublabel').textContent = SUBS[outcome](reward);
    document.getElementById('openCount').textContent = totalOpened + ' chest' + (totalOpened === 1 ? '' : 's') +
      ' opened';
    document.getElementById('mGold').textContent = totalGold.toLocaleString();
    document.getElementById('mRare').textContent = counts.rare;
    document.getElementById('mTrap').textContent = counts.trap;
    document.getElementById('mMon').textContent = counts.monster;
    document.getElementById('mBomb').textContent = counts.bomb;
  }

  function simulate() {
    const probs = hasCharm ? OUTCOMES.charm : OUTCOMES.base;
    const simCounts = {
      gold: 0,
      rare: 0,
      trap: 0,
      monster: 0,
      bomb: 0
    };
    for (let i = 0; i < 10000; i++) {
      simCounts[roll(probs)]++;
    }
    document.getElementById('simNote').textContent = (hasCharm ? 'With Lucky Charm — ' : 'No Lucky Charm — ') +
      '10,000 chest openings';
    const keys = ['gold', 'rare', 'trap', 'monster', 'bomb'];
    const barsDiv = document.getElementById('lootBars');
    barsDiv.innerHTML = '';
    barsDiv.style.display = 'block';
    document.getElementById('chartTitle').style.display = 'block';
    for (const k of keys) {
      const pct = (simCounts[k] / 100).toFixed(1);
      barsDiv.innerHTML += `<div class="loot-row">
      <span class="loot-name">${ICONS[k]} ${k.charAt(0).toUpperCase()+k.slice(1)}</span>
      <div class="loot-bar-bg"><div class="loot-bar-fill" style="width:${pct}%;background:${COLORS[k]}"></div></div>
      <span class="loot-pct">${pct}%</span>
    </div>`;
    }
    document.getElementById('chartWrap').style.display = 'block';
    if (chartInst) chartInst.destroy();
    chartInst = new Chart(document.getElementById('lootChart'), {
      type: 'bar',
      data: {
        labels: ['💰 Gold', '💎 Rare', '💀 Trap', '👹 Monster', '💣 Bomb'],
        datasets: [{
          label: 'Count (10,000 runs)',
          data: [simCounts.gold, simCounts.rare, simCounts.trap, simCounts.monster, simCounts.bomb],
          backgroundColor: [COLORS.gold, COLORS.rare, COLORS.trap, COLORS.monster, COLORS.bomb],
          borderRadius: 6,
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
              label: (ctx) => `${ctx.parsed.y.toLocaleString()} times (${(ctx.parsed.y/100).toFixed(1)}%)`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              autoSkip: false,
              font: {
                size: 13
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