
(function () {
  const errBox = document.getElementById('boot-error');
  function fail(e) {
    console.error(e);
    errBox.hidden = false;
    errBox.textContent = 'NOVA preview failed to start: ' + (e && e.message ? e.message : e);
  }

  try {
    if (typeof THREE === 'undefined') throw new Error('Three.js failed to load (CDN).');
    if (!window.NovaDials) throw new Error('dials.js failed to load.');

    const state = {
      mode: 'complete',
      down: 48.7, up: 18.3, ping: 14, cpu: 23, ram: 41, temp: 52.6, disk: 67,
      history: Array.from({ length: 80 }, () => 30 + Math.random() * 40),
    };

    const dials = {
      down: NovaDials.createDial(document.getElementById('dial-down'), { max: 100 }),
      up: NovaDials.createDial(document.getElementById('dial-up'), { max: 50 }),
      ping: NovaDials.createDial(document.getElementById('dial-ping'), { max: 120 }),
      sDown: NovaDials.createDial(document.getElementById('s-dial-down'), { max: 200 }),
      sUp: NovaDials.createDial(document.getElementById('s-dial-up'), { max: 200 }),
      sPing: NovaDials.createDial(document.getElementById('s-dial-ping'), { max: 120 }),
    };

    function setMode(mode) {
      state.mode = mode;
      document.getElementById('view-complete').classList.toggle('active', mode === 'complete');
      document.getElementById('view-simple').classList.toggle('active', mode === 'simple');
      document.getElementById('btn-complete').classList.toggle('active', mode === 'complete');
      document.getElementById('btn-simple').classList.toggle('active', mode === 'simple');
      // resize webgl when shown
      requestAnimationFrame(() => Object.values(dials).forEach((d) => d.resize()));
    }
    document.getElementById('btn-simple').onclick = () => setMode('simple');
    document.getElementById('btn-complete').onclick = () => setMode('complete');
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); setMode(state.mode === 'simple' ? 'complete' : 'simple'); }
      if (e.key === '1') setMode('simple');
      if (e.key === '2') setMode('complete');
    });

    function tickClock() {
      const now = new Date();
      document.getElementById('clock').textContent = now.toLocaleTimeString('en-GB', { hour12: false });
      document.getElementById('date').textContent = now.toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      });
    }

    function drawSpark() {
      const c = document.getElementById('spark');
      const ctx = c.getContext('2d');
      const w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(158,176,194,0.15)';
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(0, (h / 4) * i); ctx.lineTo(w, (h / 4) * i); ctx.stroke();
      }
      ctx.beginPath();
      state.history.forEach((v, i) => {
        const x = (i / (state.history.length - 1)) * (w - 2);
        const y = h - 4 - (v / 120) * (h - 10);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#9eb0c2';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    function drawRing(canvas, pct) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width, cx = w / 2, r = w * 0.34;
      ctx.clearRect(0, 0, w, w);
      ctx.beginPath(); ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#2a313c'; ctx.lineWidth = 7; ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cx, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pct / 100));
      const g = ctx.createLinearGradient(0, 0, w, w);
      g.addColorStop(0, '#e8b07a'); g.addColorStop(1, '#8a5530');
      ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      state.down = lerp(state.down, 42 + Math.sin(t / 1.7) * 22, 0.04);
      state.up = lerp(state.up, 16 + Math.cos(t / 1.4) * 8, 0.04);
      state.ping = lerp(state.ping, 12 + Math.abs(Math.sin(t / 2.1)) * 14, 0.05);
      state.cpu = lerp(state.cpu, 18 + Math.abs(Math.sin(t / 2.8)) * 26, 0.03);
      state.ram = lerp(state.ram, 36 + Math.abs(Math.cos(t / 3.3)) * 16, 0.03);

      if (Math.random() < 0.1) {
        state.history.push(state.down * 0.7 + state.up);
        if (state.history.length > 80) state.history.shift();
      }

      dials.down.setValue(state.down);
      dials.up.setValue(state.up);
      dials.ping.setValue(state.ping);
      dials.sDown.setValue(state.down * 2.2);
      dials.sUp.setValue(state.up * 2);
      dials.sPing.setValue(state.ping);

      Object.values(dials).forEach((d) => d.renderFrame(dt));

      document.getElementById('v-down').textContent = state.down.toFixed(1);
      document.getElementById('v-up').textContent = state.up.toFixed(1);
      document.getElementById('v-ping').textContent = state.ping.toFixed(0);
      document.getElementById('sv-down').textContent = (state.down * 2.2).toFixed(1);
      document.getElementById('sv-up').textContent = (state.up * 2).toFixed(1);
      document.getElementById('sv-ping').textContent = state.ping.toFixed(0);
      document.getElementById('v-cpu').textContent = state.cpu.toFixed(0) + '%';
      document.getElementById('v-ram').textContent = state.ram.toFixed(0) + '%';

      if (state.mode === 'complete') {
        drawSpark();
        drawRing(document.getElementById('cpu'), state.cpu);
        drawRing(document.getElementById('ram'), state.ram);
      }

      requestAnimationFrame(frame);
    }

    tickClock();
    setInterval(tickClock, 1000);
    setMode('complete');
    requestAnimationFrame(frame);
  } catch (e) {
    fail(e);
  }
})();
