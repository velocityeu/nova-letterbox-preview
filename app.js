
(function () {
  const err = document.getElementById('err');
  function fail(e) {
    console.error(e);
    err.className = 'show';
    err.textContent = 'Preview error: ' + (e && e.message ? e.message : e);
  }

  try {
    const S = {
      mode: 'complete',
      down: 48.7, up: 18.3, ping: 14, cpu: 23, ram: 41,
      shown: { down: 48.7, up: 18.3, ping: 14 },
      hist: Array.from({ length: 70 }, () => 35 + Math.random() * 40),
    };

    /** Face-on photoreal dial — matches design (circular bezel, not edge-on torus) */
    function drawDial(canvas, value, max) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.42;
      ctx.clearRect(0, 0, W, H);

      // under shadow
      ctx.beginPath();
      ctx.arc(cx + 3, cy + 8, R + 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      // outer copper bezel (annulus)
      let g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      g.addColorStop(0, '#f0d0a8');
      g.addColorStop(0.25, '#d4924a');
      g.addColorStop(0.5, '#6a4020');
      g.addColorStop(0.75, '#e0a066');
      g.addColorStop(1, '#8a5530');
      ctx.beginPath();
      ctx.arc(cx, cy, R + 18, 0, Math.PI * 2);
      ctx.arc(cx, cy, R + 3, 0, Math.PI * 2, true);
      ctx.fillStyle = g;
      ctx.fill();

      // specular on bezel
      ctx.beginPath();
      ctx.arc(cx, cy, R + 16, -Math.PI * 0.95, -Math.PI * 0.2);
      ctx.strokeStyle = 'rgba(255,245,220,0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R + 16, Math.PI * 0.15, Math.PI * 0.9);
      ctx.strokeStyle = 'rgba(30,15,5,0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // inner lip
      g = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R + 2);
      g.addColorStop(0, '#2a1c12');
      g.addColorStop(1, '#0a0705');
      ctx.beginPath();
      ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
      ctx.arc(cx, cy, R - 2, 0, Math.PI * 2, true);
      ctx.fillStyle = g;
      ctx.fill();

      // face
      g = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, 2, cx, cy, R);
      g.addColorStop(0, '#2a323e');
      g.addColorStop(0.55, '#12161d');
      g.addColorStop(1, '#06080b');
      ctx.beginPath();
      ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // inner vignette
      ctx.beginPath();
      ctx.arc(cx, cy, R - 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 12;
      ctx.stroke();

      // glass highlight
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.88, -Math.PI * 0.95, -Math.PI * 0.4);
      ctx.strokeStyle = 'rgba(180,210,240,0.1)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();

      // scale
      const start = Math.PI * 0.75;
      const end = Math.PI * 2.25;
      ctx.font = `600 ${Math.max(11, R * 0.085)}px ui-sans-serif,system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const a = start + (end - start) * t;
        const major = i % 2 === 0;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * (major ? 0.68 : 0.74), cy + Math.sin(a) * R * (major ? 0.68 : 0.74));
        ctx.lineTo(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82);
        ctx.strokeStyle = major ? '#e0a066' : 'rgba(167,182,198,0.55)';
        ctx.lineWidth = major ? 2.4 : 1.2;
        ctx.stroke();
        if (major) {
          const label = Math.round(max * t);
          ctx.fillStyle = 'rgba(232,176,122,0.9)';
          ctx.fillText(String(label), cx + Math.cos(a) * R * 0.56, cy + Math.sin(a) * R * 0.56);
        }
      }

      // needle shadow + needle
      const v = Math.max(0, Math.min(max, value));
      const na = start + (end - start) * (v / max);
      function needle(ox, oy, color) {
        ctx.save();
        ctx.translate(cx + ox, cy + oy);
        ctx.rotate(na);
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(0, -4.5);
        ctx.lineTo(R * 0.72, 0);
        ctx.lineTo(0, 4.5);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }
      needle(2, 3, 'rgba(0,0,0,0.4)');
      g = ctx.createLinearGradient(0, -6, 0, 6);
      // rebuild gradient in rotated space via fill then overlay
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(na);
      const ng = ctx.createLinearGradient(0, -6, 0, 6);
      ng.addColorStop(0, '#ffc078');
      ng.addColorStop(0.45, '#ff8a2b');
      ng.addColorStop(1, '#8a3a10');
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(0, -4.5);
      ctx.lineTo(R * 0.72, 0);
      ctx.lineTo(0, 4.5);
      ctx.closePath();
      ctx.fillStyle = ng;
      ctx.fill();
      ctx.restore();

      // hub
      g = ctx.createRadialGradient(cx - 4, cy - 5, 1, cx, cy, 16);
      g.addColorStop(0, '#f0c8a0');
      g.addColorStop(0.45, '#c9854a');
      g.addColorStop(1, '#3a2414');
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#0c0906';
      ctx.fill();
    }

    function drawSpark() {
      const c = document.getElementById('spark');
      const ctx = c.getContext('2d');
      const w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(167,182,198,0.15)';
      ctx.font = '10px ui-sans-serif,system-ui,sans-serif';
      ctx.fillStyle = 'rgba(167,182,198,0.45)';
      [0, 50, 100].forEach((y) => {
        const yy = h - 8 - (y / 100) * (h - 18);
        ctx.beginPath(); ctx.moveTo(28, yy); ctx.lineTo(w - 4, yy); ctx.stroke();
        ctx.fillText(String(y), 2, yy + 3);
      });
      ctx.beginPath();
      S.hist.forEach((v, i) => {
        const x = 28 + (i / (S.hist.length - 1)) * (w - 36);
        const y = h - 8 - (v / 100) * (h - 18);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#9eb6d0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    function drawRing(id, pct) {
      const c = document.getElementById(id);
      const ctx = c.getContext('2d');
      const w = c.width, cx = w / 2, r = w * 0.34;
      ctx.clearRect(0, 0, w, w);
      ctx.beginPath(); ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#2a313c'; ctx.lineWidth = 8; ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cx, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pct / 100));
      const g = ctx.createLinearGradient(0, 0, w, w);
      g.addColorStop(0, '#e8b07a'); g.addColorStop(1, '#8a5530');
      ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
    }

    function setMode(m) {
      S.mode = m;
      document.getElementById('complete').classList.toggle('on', m === 'complete');
      document.getElementById('simple').classList.toggle('on', m === 'simple');
      document.getElementById('btn-complete').classList.toggle('on', m === 'complete');
      document.getElementById('btn-simple').classList.toggle('on', m === 'simple');
    }
    document.getElementById('btn-simple').onclick = () => setMode('simple');
    document.getElementById('btn-complete').onclick = () => setMode('complete');
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); setMode(S.mode === 'simple' ? 'complete' : 'simple'); }
      if (e.key === '1') setMode('simple');
      if (e.key === '2') setMode('complete');
    });

    function clock() {
      const n = new Date();
      document.getElementById('clock').textContent = n.toLocaleTimeString('en-GB', { hour12: false });
      document.getElementById('date').textContent = n.toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      });
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function paintVisible() {
      document.querySelectorAll('.view.on canvas[data-k]').forEach((c) => {
        const k = c.dataset.k;
        const max = Number(c.dataset.max);
        let val = S.shown[k];
        if (S.mode === 'simple' && (k === 'down' || k === 'up')) val = S.shown[k] * (k === 'down' ? 2.2 : 2);
        drawDial(c, val, max);
      });
    }

    function frame() {
      const t = performance.now() / 1000;
      S.down = lerp(S.down, 45 + Math.sin(t / 1.6) * 20, 0.05);
      S.up = lerp(S.up, 16 + Math.cos(t / 1.3) * 7, 0.05);
      S.ping = lerp(S.ping, 12 + Math.abs(Math.sin(t / 2)) * 10, 0.06);
      S.cpu = lerp(S.cpu, 20 + Math.abs(Math.sin(t / 2.6)) * 20, 0.04);
      S.ram = lerp(S.ram, 38 + Math.abs(Math.cos(t / 3)) * 14, 0.04);
      // damped needle follow
      S.shown.down = lerp(S.shown.down, S.down, 0.12);
      S.shown.up = lerp(S.shown.up, S.up, 0.12);
      S.shown.ping = lerp(S.shown.ping, S.ping, 0.12);

      if (Math.random() < 0.1) {
        S.hist.push(Math.min(100, S.down * 0.8 + S.up));
        if (S.hist.length > 70) S.hist.shift();
      }

      document.getElementById('d-down').textContent = S.down.toFixed(1);
      document.getElementById('d-up').textContent = S.up.toFixed(1);
      document.getElementById('d-ping').textContent = S.ping.toFixed(0);
      document.getElementById('s-down').textContent = (S.down * 2.2).toFixed(1);
      document.getElementById('s-up').textContent = (S.up * 2).toFixed(1);
      document.getElementById('s-ping').textContent = S.ping.toFixed(0);
      document.getElementById('d-cpu').textContent = S.cpu.toFixed(0) + '%';
      document.getElementById('d-ram').textContent = S.ram.toFixed(0) + '%';

      paintVisible();
      if (S.mode === 'complete') {
        drawSpark();
        drawRing('cpu', S.cpu);
        drawRing('ram', S.ram);
      }
      requestAnimationFrame(frame);
    }

    clock();
    setInterval(clock, 1000);
    setMode('complete');
    requestAnimationFrame(frame);
  } catch (e) { fail(e); }
})();
