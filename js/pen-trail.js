(() => {
  const MIN_POINT_GAP = 2.5;
  const MAX_STROKE_GAP = 52;
  const INK_DURATION_MS = 3000;
  const FADE_MS = 450;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion) return;

  const canvas = document.createElement("canvas");
  canvas.className = "pen-trail";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let penColor = "#543f3f";
  let dpr = 1;
  let width = 0;
  let height = 0;
  let lastPoint = null;
  let segments = [];
  let rafId = 0;

  function readPenColor() {
    const value = getComputedStyle(document.body).getPropertyValue("--ink").trim();
    if (value) penColor = value;
  }

  function clearInk() {
    ctx.clearRect(0, 0, width, height);
    lastPoint = null;
    segments = [];
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readPenColor();
    clearInk();
  }

  function inkAlpha(ageMs) {
    if (ageMs >= INK_DURATION_MS) return 0;
    if (ageMs <= INK_DURATION_MS - FADE_MS) return 0.92;
    const fade = (ageMs - (INK_DURATION_MS - FADE_MS)) / FADE_MS;
    return 0.92 * (1 - fade);
  }

  function buildInkSamples(x0, y0, x1, y1) {
    const distance = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(distance / 1.35));
    const samples = [];

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      samples.push({
        x: x0 + (x1 - x0) * t + (Math.random() - 0.5) * 0.65,
        y: y0 + (y1 - y0) * t + (Math.random() - 0.5) * 0.65,
        radius: 0.58 + Math.random() * 0.38,
        grain: 0.74 + Math.random() * 0.2,
      });
    }

    return samples;
  }

  function drawInkSamples(samples, fadeAlpha) {
    ctx.fillStyle = penColor;

    for (const dot of samples) {
      ctx.globalAlpha = fadeAlpha * dot.grain;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function redrawInk() {
    rafId = 0;
    if (document.body.dataset.page === "3") {
      clearInk();
      return;
    }

    const now = Date.now();
    segments = segments.filter((segment) => now - segment.t < INK_DURATION_MS);

    ctx.clearRect(0, 0, width, height);

    for (const segment of segments) {
      const alpha = inkAlpha(now - segment.t);
      if (alpha <= 0 || !segment.samples?.length) continue;
      drawInkSamples(segment.samples, alpha);
    }

    if (segments.length) {
      rafId = requestAnimationFrame(redrawInk);
    }
  }

  function scheduleRedraw() {
    if (!rafId) rafId = requestAnimationFrame(redrawInk);
  }

  function markAt(x, y) {
    if (document.body.dataset.page === "3") return;

    const now = Date.now();

    if (lastPoint) {
      const gap = Math.hypot(x - lastPoint.x, y - lastPoint.y);
      if (gap < MIN_POINT_GAP) return;

      if (gap > MAX_STROKE_GAP) {
        segments.push({
          t: now,
          samples: buildInkSamples(x, y, x, y),
        });
        lastPoint = { x, y };
        scheduleRedraw();
        return;
      }

      segments.push({
        t: now,
        samples: buildInkSamples(lastPoint.x, lastPoint.y, x, y),
      });
    } else {
      segments.push({
        t: now,
        samples: buildInkSamples(x, y, x, y),
      });
    }

    lastPoint = { x, y };
    scheduleRedraw();
  }

  function breakStroke() {
    lastPoint = null;
  }

  function onPointerMove(event) {
    if (document.body.dataset.page === "3") return;
    markAt(event.clientX, event.clientY);
  }

  readPenColor();
  resizeCanvas();

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", breakStroke);
  window.addEventListener("blur", breakStroke);
  window.addEventListener("resize", resizeCanvas);

  document.addEventListener("pagechange", clearInk);
  document.addEventListener("indexreset", clearInk);
})();
