const COPPER = "#c9854a";
const COPPER_DIM = "rgba(201,133,74,0.35)";
const STEEL = "#9db0c4";
const FACE = "#161a20";

const state = {
  mode: "simple",
  down: 118,
  up: 36,
  ping: 18,
  cpu: 23,
  ram: 41,
  history: Array.from({ length: 60 }, () => 40 + Math.random() * 30),
};

function setMode(mode) {
  state.mode = mode;
  document.getElementById("view-simple").classList.toggle("active", mode === "simple");
  document.getElementById("view-complete").classList.toggle("active", mode === "complete");
  document.getElementById("btn-simple").classList.toggle("active", mode === "simple");
  document.getElementById("btn-complete").classList.toggle("active", mode === "complete");
}

document.getElementById("btn-simple").addEventListener("click", () => setMode("simple"));
document.getElementById("btn-complete").addEventListener("click", () => setMode("complete"));
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    setMode(state.mode === "simple" ? "complete" : "simple");
  }
  if (e.key === "1") setMode("simple");
  if (e.key === "2") setMode("complete");
});

function drawDial(canvas, value, max, opts = {}) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.42;
  ctx.clearRect(0, 0, w, h);

  // outer copper ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
  const ring = ctx.createLinearGradient(0, 0, w, h);
  ring.addColorStop(0, "#e0a066");
  ring.addColorStop(0.5, "#8a5a32");
  ring.addColorStop(1, "#c9854a");
  ctx.strokeStyle = ring;
  ctx.lineWidth = 10;
  ctx.stroke();

  // face
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = FACE;
  ctx.fill();
  ctx.strokeStyle = COPPER_DIM;
  ctx.lineWidth = 2;
  ctx.stroke();

  // ticks
  const start = Math.PI * 0.75;
  const end = Math.PI * 2.25;
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const a = start + (end - start) * t;
    const major = i % 2 === 0;
    const r1 = r - (major ? 18 : 10);
    const r2 = r - 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.strokeStyle = major ? COPPER : STEEL;
    ctx.lineWidth = major ? 2 : 1;
    ctx.stroke();
  }

  // needle
  const clamped = Math.max(0, Math.min(max, value));
  const na = start + (end - start) * (clamped / max);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(na);
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(0, -6);
  ctx.lineTo(r - 28, 0);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fillStyle = COPPER;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#2a1c12";
  ctx.fill();
  ctx.strokeStyle = COPPER;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawMiniRing(canvas, pct) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const cx = w / 2;
  const cy = w / 2;
  const r = w * 0.36;
  ctx.clearRect(0, 0, w, w);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#2a313c";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (pct / 100));
  ctx.strokeStyle = COPPER;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawSpark() {
  const canvas = document.getElementById("spark");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(157,176,196,0.15)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.beginPath();
  state.history.forEach((v, i) => {
    const x = (i / (state.history.length - 1)) * (w - 2);
    const y = h - 6 - (v / 120) * (h - 12);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function tickClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString("en-GB", { hour12: false });
  document.getElementById("date").textContent = now.toLocaleDateString("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
}

function lerp(a, b, t) { return a + (b - a) * t; }

function animate() {
  // gentle demo drift
  state.down = lerp(state.down, 90 + Math.sin(Date.now() / 1800) * 40 + Math.random() * 4, 0.04);
  state.up = lerp(state.up, 20 + Math.cos(Date.now() / 1600) * 12 + Math.random() * 2, 0.04);
  state.ping = lerp(state.ping, 14 + Math.abs(Math.sin(Date.now() / 2200)) * 16, 0.05);
  state.cpu = lerp(state.cpu, 18 + Math.abs(Math.sin(Date.now() / 3000)) * 30, 0.03);
  state.ram = lerp(state.ram, 35 + Math.abs(Math.cos(Date.now() / 4000)) * 20, 0.03);

  if (Math.random() < 0.08) {
    state.history.push(state.down * 0.4 + state.up);
    if (state.history.length > 60) state.history.shift();
  }

  document.querySelectorAll(".dial").forEach((el) => {
    const canvas = el.querySelector("canvas");
    const key = el.dataset.dial;
    const max = Number(el.dataset.max);
    let value = state.down;
    if (key === "up" || key === "up2") value = state.up;
    if (key === "ping" || key === "ping2") value = state.ping;
    if (key === "down2") value = state.down * 0.4;
    drawDial(canvas, value, max);
    const ve = el.dataset.valueEl;
    if (ve) {
      const node = document.getElementById(ve);
      if (node) node.textContent = (key.includes("ping") ? value.toFixed(0) : value.toFixed(1));
    }
  });

  drawMiniRing(document.getElementById("cpu"), state.cpu);
  drawMiniRing(document.getElementById("ram"), state.ram);
  document.getElementById("cpu-val").textContent = `${state.cpu.toFixed(0)}%`;
  document.getElementById("ram-val").textContent = `${state.ram.toFixed(0)}%`;
  drawSpark();
  requestAnimationFrame(animate);
}

tickClock();
setInterval(tickClock, 1000);
setMode("simple");
animate();
