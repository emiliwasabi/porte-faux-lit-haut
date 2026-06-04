const pageNumber = document.querySelector(".page-number");
let page = 1;

const PAGE_LABELS = {
  1: "1",
  2: "2",
  3: "3",
};

const coverLayer = document.querySelector(".book-layer--cover");
const spreadLayer = document.querySelector(".book-layer--spread");
const topContent = document.querySelector(".top-content");
const indexSheet = document.querySelector(".index-sheet");
const aboutSheet = document.querySelector(".about-sheet");
const bookGutter = document.querySelector(".book-gutter");
const symbolLayer = document.querySelector(".symbol-layer");

const hosts = {
  coverTextAbove: document.querySelector(".cover-text-host--above"),
  coverTextUnder: document.querySelector(".cover-text-host--under"),
  indexCover: document.querySelector(".index-host--cover"),
  indexAbove: document.querySelector(".index-host--above"),
  indexUnder: document.querySelector(".index-host--under"),
  aboutAbove: document.querySelector(".about-host--above"),
  aboutUnder: document.querySelector(".about-host--under"),
  symbolCover: document.querySelector(".symbol-host--cover"),
  symbolAbove: document.querySelector(".symbol-host--above"),
  symbolUnder: document.querySelector(".symbol-host--under"),
  gutterCover: document.querySelector(".gutter-host--cover"),
  gutterAbove: document.querySelector(".gutter-host--above"),
};

function mount(panel, host) {
  if (!panel || !host) return;
  panel.hidden = false;
  if (panel.parentElement !== host) {
    host.appendChild(panel);
  }
}

function placeTopContent() {
  if (!topContent) return;
  if (page === 1) {
    mount(topContent, hosts.coverTextAbove);
  } else {
    mount(topContent, hosts.coverTextUnder);
  }
}

function placeIndexSheet() {
  if (!indexSheet) return;
  if (page === 1) {
    mount(indexSheet, hosts.indexCover);
  } else if (page === 2) {
    mount(indexSheet, hosts.indexAbove);
  } else {
    mount(indexSheet, hosts.indexUnder);
  }
}

function placeAboutSheet() {
  if (!aboutSheet) return;
  if (page === 3) {
    mount(aboutSheet, hosts.aboutAbove);
  } else {
    mount(aboutSheet, hosts.aboutUnder);
  }
}

function placeSymbolLayer() {
  if (!symbolLayer) return;
  if (page === 1) {
    mount(symbolLayer, hosts.symbolCover);
  } else if (page === 2) {
    mount(symbolLayer, hosts.symbolAbove);
  } else {
    mount(symbolLayer, hosts.symbolUnder);
  }
}

function placeGutter() {
  if (!bookGutter) return;
  if (page === 1) {
    mount(bookGutter, hosts.gutterCover);
  } else {
    mount(bookGutter, hosts.gutterAbove);
  }
}

function setPage(next) {
  page = next;
  document.body.dataset.page = String(page);
  if (pageNumber) {
    pageNumber.textContent = PAGE_LABELS[page] ?? String(page);
  }
  if (coverLayer) coverLayer.hidden = page !== 1;
  if (spreadLayer) spreadLayer.hidden = page === 1;

  placeTopContent();
  placeIndexSheet();
  placeAboutSheet();
  placeSymbolLayer();
  placeGutter();

  document.dispatchEvent(new CustomEvent("pagechange", { detail: { page } }));
}

function goToIndexPage() {
  setPage(2);
}

function goToAboutPage() {
  setPage(3);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest(".jaquette")) {
    if (target.closest(".nav-index")) {
      event.preventDefault();
      goToIndexPage();
      return;
    }
    if (target.closest(".nav-about")) {
      event.preventDefault();
      goToAboutPage();
      return;
    }
    return;
  }

  if (target.closest("a.index-entry")) return;
  if (target.closest(".gutter-contacts a")) return;

  if (page === 1) goToIndexPage();
});

setPage(1);
