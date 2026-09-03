(function () {
  const exprEl = document.getElementById('expr');
  const resultEl = document.getElementById('result');
  const grid = document.getElementById('grid');
  let expr = '';

  function safeEval(e) {
    if (!e) return '';
    if (!/^[0-9+\-*/().%\s]+$/.test(e)) return 'Error';
    try {
      const s = e.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
      const r = Function('"use strict";return (' + s + ')')();
      if (typeof r !== 'number' || !isFinite(r)) return 'Error';
      return String(Math.round(r * 1e10) / 1e10);
    } catch { return 'Error'; }
  }

  function render() {
    exprEl.textContent = expr || '0';
    const r = safeEval(expr);
    if (r !== '' && r !== 'Error') {
      resultEl.textContent = '= ' + r;
      resultEl.classList.remove('pop');
      void resultEl.offsetWidth;
      resultEl.classList.add('pop');
    } else if (!expr) {
      resultEl.textContent = '= 0';
    }
  }

  function press(action, value) {
    if (action === 'clear') { expr = ''; resultEl.textContent = '= 0'; }
    else if (action === 'delete') { expr = expr.slice(0, -1); }
    else if (action === 'equals') {
      const r = safeEval(expr);
      if (r && r !== 'Error') { expr = r; resultEl.textContent = '= ' + r; }
      else { resultEl.textContent = '= Error'; }
    }
    else if (action === 'percent') { expr += '%'; }
    else if (value !== undefined) { expr += value; }
    render();
  }

  function ripple(btn, x, y) {
    const rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + 'px';
    r.style.left = (x - rect.left - size / 2) + 'px';
    r.style.top = (y - rect.top - size / 2) + 'px';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.calc-btn');
    if (!btn) return;
    ripple(btn, e.clientX, e.clientY);
    press(btn.dataset.action, btn.dataset.value);
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (/^[0-9.+\-*/%]$/.test(k)) { expr += k; render(); }
    else if (k === 'Enter' || k === '=') { e.preventDefault(); press('equals'); }
    else if (k === 'Backspace') { press('delete'); }
    else if (k === 'Escape') { press('clear'); }
  });

  const layer = document.getElementById('cursor-layer');
  let mx = innerWidth / 2, my = innerHeight / 2, lastP = 0, lastT = 0;
  addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  function tick(t) {
    if (t - lastP > 30) {
      lastP = t;
      const p = document.createElement('span');
      p.className = 'cursor-particle';
      p.style.left = mx + 'px'; p.style.top = my + 'px';
      layer.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
    if (t - lastT > 140) {
      lastT = t;
      const tx = document.createElement('span');
      tx.className = 'cursor-text';
      tx.textContent = 'AHMED REHMAT';
      tx.style.left = (mx + (Math.random() * 30 - 15)) + 'px';
      tx.style.top = (my + (Math.random() * 30 - 15)) + 'px';
      layer.appendChild(tx);
      setTimeout(() => tx.remove(), 1200);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  render();
})();