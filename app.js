
const state = {
  mode: 'simple',
  down: 118, up: 36, ping: 18, cpu: 23, ram: 41,
  history: Array.from({ length: 72 }, () => 35 + Math.random() * 40),
};

function setMode(mode) {
  state.mode = mode;
  document.getElementById('view-simple').classList.toggle('active', mode === 'simple');
  document.getElementById('view-complete').classList.toggle('active', mode === 'complete');
  document.getElementById('btn-simple').classList.toggle('active', mode === 'simple');
  document.getElementById('btn-complete').classList.toggle('active', mode === 'complete');
}
document.getElementById('btn-simple').onclick = () => setMode('simple');
document.getElementById('btn-complete').onclick = () => setMode('complete');
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') { e.preventDefault(); setMode(state.mode === 'simple' ? 'complete' : 'simple'); }
  if (e.key === '1') setMode('simple');
  if (e.key === '2') setMode('complete');
});

/** Photorealistic 3D instrument dial */
function drawDial3D(canvas, value, max) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.44;
  ctx.clearRect(0, 0, W, H);

  // Drop shadow under whole gauge
  ctx.beginPath();
  ctx.arc(cx + 4, cy + 10, R + 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  // Outer bezel - thick machined copper ring with specular
  const bezelOuter = R + 16;
  const bezelInner = R + 4;
  let g = ctx.createLinearGradient(cx - bezelOuter, cy - bezelOuter, cx + bezelOuter, cy + bezelOuter);
  g.addColorStop(0, '#f2d0a8');
  g.addColorStop(0.22, '#c9854a');
  g.addColorStop(0.48, '#6e4324');
  g.addColorStop(0.72, '#e0a066');
  g.addColorStop(1, '#8a5530');
  ctx.beginPath();
  ctx.arc(cx, cy, bezelOuter, 0, Math.PI * 2);
  ctx.arc(cx, cy, bezelInner, 0, Math.PI * 2, true);
  ctx.fillStyle = g;
  ctx.fill();

  // Bezel rim highlight (top-left) and dark crease (bottom-right)
  ctx.beginPath();
  ctx.arc(cx, cy, bezelOuter - 1, -Math.PI * 0.9, -Math.PI * 0.15);
  ctx.strokeStyle = 'rgba(255,240,210,0.55)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, bezelOuter - 1, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = 'rgba(40,20,8,0.55)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner step / chamfer (recessed lip)
  g = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.2, cx, cy, R + 2);
  g.addColorStop(0, '#3a2a1c');
  g.addColorStop(0.7, '#1a1410');
  g.addColorStop(1, '#0c0a08');
  ctx.beginPath();
  ctx.arc(cx, cy, bezelInner, 0, Math.PI * 2);
  ctx.arc(cx, cy, R, 0, Math.PI * 2, true);
  ctx.fillStyle = g;
  ctx.fill();

  // Dial face - concave dark glass
  g = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, 4, cx, cy, R);
  g.addColorStop(0, '#2a313c');
  g.addColorStop(0.45, '#141820');
  g.addColorStop(1, '#07090c');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // Soft vignette ring inside face
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Glass specular arc
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.92, -Math.PI * 0.95, -Math.PI * 0.35);
  ctx.strokeStyle = 'rgba(180,210,240,0.12)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Scale arc
  const start = Math.PI * 0.75;
  const end = Math.PI * 2.25;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.78, start, end);
  ctx.strokeStyle = 'rgba(201,133,74,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Ticks + numbers (outside needle path, inside rim)
  ctx.font = `${Math.max(10, R * 0.075)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const majors = 8;
  for (let i = 0; i <= majors * 2; i++) {
    const t = i / (majors * 2);
    const a = start + (end - start) * t;
    const major = i % 2 === 0;
    const r1 = R * (major ? 0.62 : 0.68);
    const r2 = R * 0.76;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.strokeStyle = major ? '#d9a46a' : 'rgba(168,183,200,0.55)';
    ctx.lineWidth = major ? 2.2 : 1.1;
    ctx.stroke();
    if (major) {
      const label = Math.round((max * i) / (majors * 2));
      const lr = R * 0.52;
      ctx.fillStyle = 'rgba(232,176,122,0.85)';
      ctx.fillText(String(label), cx + Math.cos(a) * lr, cy + Math.sin(a) * lr);
    }
  }

  // Needle shadow
  const clamped = Math.max(0, Math.min(max, value));
  const na = start + (end - start) * (clamped / max);
  ctx.save();
  ctx.translate(cx + 2, cy + 3);
  ctx.rotate(na);
  drawNeedle(ctx, R * 0.7, 'rgba(0,0,0,0.45)');
  ctx.restore();

  // Needle body
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(na);
  drawNeedle(ctx, R * 0.7, null);
  ctx.restore();

  // Center boss (3D hub)
  g = ctx.createRadialGradient(cx - 4, cy - 5, 1, cx, cy, 16);
  g.addColorStop(0, '#f0c8a0');
  g.addColorStop(0.4, '#c9854a');
  g.addColorStop(1, '#3a2414');
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  g = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, 7);
  g.addColorStop(0, '#2a1c12');
  g.addColorStop(1, '#0a0705');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,230,200,0.35)';
  ctx.fill();
}

function drawNeedle(ctx, length, forceColor) {
  // Tapered 3D needle with highlight edge
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-2, -5);
  ctx.lineTo(length, 0);
  ctx.lineTo(-2, 5);
  ctx.closePath();
  if (forceColor) {
    ctx.fillStyle = forceColor;
    ctx.fill();
    return;
  }
  const g = ctx.createLinearGradient(0, -6, 0, 6);
  g.addColorStop(0, '#f3d2ae');
  g.addColorStop(0.45, '#c9854a');
  g.addColorStop(1, '#5a3518');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-1, -1.5);
  ctx.lineTo(length * 0.92, 0);
  ctx.lineTo(-1, 1.5);
  ctx.strokeStyle = 'rgba(255,240,220,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawMini(canvas, pct) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, cx = w / 2, r = w * 0.34;
  ctx.clearRect(0, 0, w, w);
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#2a313c';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cx, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pct / 100));
  const g = ctx.createLinearGradient(0, 0, w, w);
  g.addColorStop(0, '#e8b07a');
  g.addColorStop(1, '#8a5530');
  ctx.strokeStyle = g;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawSpark() {
  const canvas = document.getElementById('spark');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(168,183,200,0.12)';
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (h / 4) * i);
    ctx.lineTo(w, (h / 4) * i);
    ctx.stroke();
  }
  ctx.beginPath();
  state.history.forEach((v, i) => {
    const x = (i / (state.history.length - 1)) * (w - 2);
    const y = h - 4 - (v / 140) * (h - 10);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#a8b7c8';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function lerp(a, b, t) { return a + (b - a) * t; }

function tickClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-GB', { hour12: false });
  document.getElementById('date').textContent = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

function animate() {
  const t = Date.now();
  state.down = lerp(state.down, 95 + Math.sin(t / 1700) * 45, 0.05);
  state.up = lerp(state.up, 22 + Math.cos(t / 1500) * 14, 0.05);
  state.ping = lerp(state.ping, 12 + Math.abs(Math.sin(t / 2100)) * 18, 0.06);
  state.cpu = lerp(state.cpu, 18 + Math.abs(Math.sin(t / 2800)) * 28, 0.04);
  state.ram = lerp(state.ram, 36 + Math.abs(Math.cos(t / 3500)) * 18, 0.04);
  if (Math.random() < 0.1) {
    state.history.push(state.down * 0.35 + state.up);
    if (state.history.length > 72) state.history.shift();
  }

  document.querySelectorAll('.dial-canvas').forEach((c) => {
    const key = c.dataset.key;
    const max = Number(c.dataset.max);
    const val = state[key];
    // only draw visible view canvases for perf
    const view = c.closest('.view');
    if (view && !view.classList.contains('active')) return;
    drawDial3D(c, val, max);
  });

  document.getElementById('s-down').textContent = state.down.toFixed(1);
  document.getElementById('s-up').textContent = state.up.toFixed(1);
  document.getElementById('s-ping').textContent = state.ping.toFixed(0);
  document.getElementById('c-down').textContent = (state.down * 0.42).toFixed(1);
  document.getElementById('c-up').textContent = state.up.toFixed(1);
  document.getElementById('c-ping').textContent = state.ping.toFixed(0);

  if (document.getElementById('view-complete').classList.contains('active')) {
    drawMini(document.getElementById('cpu'), state.cpu);
    drawMini(document.getElementById('ram'), state.ram);
    document.getElementById('cpu-val').textContent = `${state.cpu.toFixed(0)}%`;
    document.getElementById('ram-val').textContent = `${state.ram.toFixed(0)}%`;
    drawSpark();
  }

  requestAnimationFrame(animate);
}

tickClock();
setInterval(tickClock, 1000);
setMode('simple');
animate();
