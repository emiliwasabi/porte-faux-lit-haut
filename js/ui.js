(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function scatterSpan(span) {
    const y = Math.round((Math.random() - 0.5) * 7);
    const deg =
      Math.random() < 0.22 ? 180 : Math.round((Math.random() - 0.5) * 26);
    const s = (0.92 + Math.random() * 0.14).toFixed(2);
    span.style.transform = `translateY(${y}px) rotate(${deg}deg) scale(${s})`;
  }

  function letterizeGutter(line) {
    if (line.querySelector("a")) return;
    const text = line.textContent.trim();
    line.textContent = "";
    line.classList.add("gutter-label");
    [...text].forEach((char) => {
      const span = document.createElement("span");
      span.className = "gutter-letter";
      span.textContent = char === " " ? "\u00A0" : char;
      if (!reduced && /\S/.test(char)) scatterSpan(span);
      line.append(span);
    });
  }

  function letterizeCover(line) {
    const text = line.textContent.trim();
    const letters = [...text];
    line.textContent = "";
    line.classList.add("cover-tagline");
    const spans = letters.map((char) => {
      const span = document.createElement("span");
      span.className = "cover-letter";
      span.textContent = char === " " ? "\u00A0" : char;
      line.append(span);
      return span;
    });

    if (reduced) return;

    let scattered = false;

    line.addEventListener("pointerenter", () => {
      if (scattered) {
        spans.forEach((span) => {
          span.style.transform = "";
        });
        scattered = false;
      } else {
        spans.forEach((span) => {
          if (/\S/.test(span.textContent)) scatterSpan(span);
        });
        scattered = true;
      }
    });
  }

  document.querySelectorAll(".gutter-contacts p").forEach(letterizeGutter);
  document.querySelectorAll(".contacts p").forEach(letterizeCover);

  const jaquette = document.querySelector(".jaquette");
  const bookOpen = () => {
    const p = document.body.dataset.page;
    return p === "2" || p === "3";
  };
  jaquette?.addEventListener("click", (e) => {
    if (!bookOpen() || e.target.closest(".nav-links a")) return;
    e.stopPropagation();
    jaquette.classList.add("is-revealed");
  });
  document.addEventListener("click", (e) => {
    if (!bookOpen() || !(e.target instanceof Element)) return;
    if (!e.target.closest(".jaquette")) jaquette?.classList.remove("is-revealed");
  });
  document.addEventListener("pagechange", () => {
    jaquette?.classList.remove("is-revealed");
  });
})();
