function playfulOffset() {
  return Math.round((Math.random() - 0.5) * 7);
}

function playfulRotate() {
  const flip = Math.random() < 0.22;
  if (flip) return 180;
  return Math.round((Math.random() - 0.5) * 26);
}

function wrapGutterLabels() {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  document.querySelectorAll(".gutter-contacts p").forEach((line) => {
    if (line.querySelector("a")) return;

    const text = line.textContent.trim();
    line.textContent = "";
    line.classList.add("gutter-label");

    [...text].forEach((char) => {
      const span = document.createElement("span");
      span.className = "gutter-letter";
      span.textContent = char === " " ? "\u00A0" : char;

      if (!reducedMotion && /[^\s]/.test(char)) {
        const y = playfulOffset();
        const deg = playfulRotate();
        const scale = 0.92 + Math.random() * 0.14;
        span.style.transform = `translateY(${y}px) rotate(${deg}deg) scale(${scale.toFixed(2)})`;
      }

      line.appendChild(span);
    });
  });
}

wrapGutterLabels();
