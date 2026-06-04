const AVAILABLE_SYMBOLS = [
  "1.png",
  "2.png",
  "4.png",
  "5.png",
  "6.png",
  "7.png",
  "8.png",
  "9.png",
  "10.png",
  "11.png",
  "12.png",
  "13.png",
];

const SLOTS = [
  { top: "10%", left: "12%" },
  { top: "18%", left: "58%" },
  { top: "38%", left: "24%" },
  { top: "48%", left: "68%" },
  { top: "68%", left: "16%" },
  { top: "78%", left: "62%" },
];

const IMAGE_COUNT = 1;

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function ensureSymbolLayer() {
  let layer = document.querySelector(".symbol-layer");
  if (layer) return layer;

  layer = document.createElement("div");
  layer.className = "symbol-layer";
  layer.setAttribute("aria-hidden", "true");

  const host =
    document.querySelector(".symbol-host--cover") ||
    document.querySelector(".symbol-host--above");
  host?.appendChild(layer);
  return layer;
}

function renderRandomSymbol() {
  const symbolLayer = ensureSymbolLayer();
  if (!symbolLayer) return;

  const pickedSymbol = shuffle(AVAILABLE_SYMBOLS)[0];
  const pickedSlot = shuffle(SLOTS)[0];

  for (let i = 0; i < IMAGE_COUNT; i += 1) {
    const img = document.createElement("img");
    img.className = "symbol";
    img.alt = "";
    img.loading = "eager";
    img.src = `./assets/images/${pickedSymbol}`;
    img.style.top = pickedSlot.top;
    img.style.left = pickedSlot.left;
    symbolLayer.appendChild(img);
  }
}

renderRandomSymbol();
