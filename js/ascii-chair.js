const CHAIR_ART = `  .-------.
  |       |
  |-------|
  |       |
  ;-------;
 /       /|
:-------: |
|       | |
|       |`;

const FLEE_RADIUS = 72;
const POINTER_GAP = 110;
const EDGE_PAD = 20;
const FLEE_COOLDOWN_MS = 380;

const host = document.querySelector(".ascii-chair-host");
const chair = document.querySelector(".ascii-chair");

let hostRect = { width: 0, height: 0, left: 0, top: 0 };
let chairSize = { width: 0, height: 0 };
let position = { x: 0, y: 0 };
let fleeing = false;
let lastFleeAt = 0;
let rafId = 0;
let pointer = { x: -9999, y: -9999 };
let active = false;

function readJaquetteReserve() {
  const value = getComputedStyle(document.body).getPropertyValue("--jaquette-width").trim();
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed)) return parsed;
  return 280;
}

function measure() {
  if (!host || !chair) return;
  hostRect = host.getBoundingClientRect();
  chairSize = {
    width: chair.offsetWidth,
    height: chair.offsetHeight,
  };
}

function setChairPosition(x, y, animate) {
  position.x = x;
  position.y = y;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!animate || reducedMotion) {
    chair.style.transition = "none";
    chair.style.transform = `translate(${x}px, ${y}px)`;
    chair.offsetHeight;
    chair.style.transition = "";
    return;
  }
  chair.style.transform = `translate(${x}px, ${y}px)`;
}

function distanceToPointer(x, y) {
  const cx = hostRect.left + x + chairSize.width / 2;
  const cy = hostRect.top + y + chairSize.height / 2;
  const dx = pointer.x - cx;
  const dy = pointer.y - cy;
  return Math.hypot(dx, dy);
}

function randomPosition(avoidPointer = true) {
  const jaquetteReserve = readJaquetteReserve() + EDGE_PAD;
  const leftPageMax = window.innerWidth * 0.5 - chairSize.width * 0.5;
  const maxX = Math.min(
    Math.max(EDGE_PAD, leftPageMax),
    hostRect.width - chairSize.width - EDGE_PAD - jaquetteReserve
  );
  const maxY = Math.max(EDGE_PAD, hostRect.height - chairSize.height - EDGE_PAD);

  for (let attempt = 0; attempt < 28; attempt += 1) {
    const x = EDGE_PAD + Math.random() * (maxX - EDGE_PAD);
    const y = EDGE_PAD + Math.random() * (maxY - EDGE_PAD);
    if (!avoidPointer || distanceToPointer(x, y) > POINTER_GAP) {
      return { x, y };
    }
  }

  const cornerX = pointer.x < hostRect.left + hostRect.width / 2 ? maxX : EDGE_PAD;
  const cornerY = pointer.y < hostRect.top + hostRect.height / 2 ? maxY : EDGE_PAD;
  return { x: cornerX, y: cornerY };
}

function flee({ animate = true } = {}) {
  if (!chair || fleeing || !active) return;
  const now = performance.now();
  if (now - lastFleeAt < FLEE_COOLDOWN_MS) return;

  fleeing = true;
  lastFleeAt = now;
  measure();
  const next = randomPosition(true);
  setChairPosition(next.x, next.y, animate);

  window.setTimeout(() => {
    fleeing = false;
  }, FLEE_COOLDOWN_MS);
}

function shouldFlee() {
  if (!active) return false;
  return distanceToPointer(position.x, position.y) < FLEE_RADIUS;
}

function onPointerMove(event) {
  if (!active) return;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  if (rafId) return;
  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    if (shouldFlee()) flee();
  });
}

function resetChair() {
  if (!host || !chair) return;
  measure();
  const start = randomPosition(false);
  setChairPosition(start.x, start.y, false);
}

function setActive(next) {
  active = next;
  if (active) {
    resetChair();
  }
}

function initChair() {
  if (!host || !chair) return;

  chair.textContent = CHAIR_ART;

  chair.addEventListener("pointerenter", () => flee());
  chair.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    flee();
  });
  chair.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", () => {
    if (!active) return;
    measure();
    const maxX = hostRect.width - chairSize.width - EDGE_PAD;
    const maxY = hostRect.height - chairSize.height - EDGE_PAD;
    setChairPosition(
      Math.min(position.x, Math.max(EDGE_PAD, maxX)),
      Math.min(position.y, Math.max(EDGE_PAD, maxY)),
      false
    );
  });

  document.addEventListener("pagechange", (event) => {
    setActive(event.detail?.page === 1);
  });

  setActive(document.body.dataset.page === "1");
}

initChair();
