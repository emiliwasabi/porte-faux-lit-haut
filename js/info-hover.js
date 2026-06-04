const alphabet = "abcdefghijklmnopqrstuvwxyz";

document.querySelectorAll(".contacts p").forEach((line) => {
  const base = line.textContent.trim();
  const current = base.split("");

  line.textContent = "";

  current.forEach((char, index) => {
    const span = document.createElement("span");
    const editable = /[a-z]/i.test(char);

    span.dataset.index = String(index);
    span.dataset.editable = editable ? "true" : "false";
    span.textContent = char === " " ? "\u00A0" : char;
    line.appendChild(span);
  });

  line.addEventListener("pointerover", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSpanElement)) return;
    if (target.dataset.editable !== "true") return;

    const index = Number(target.dataset.index);
    const next = alphabet[Math.floor(Math.random() * alphabet.length)];

    current[index] = next;
    target.textContent = next;
  });
});
