const pageNum = document.querySelector(".page-number");
const cover = document.querySelector(".book-layer--cover");
const spread = document.querySelector(".book-layer--spread");
const panels = {
  top: document.querySelector(".top-content"),
  index: document.querySelector(".index-sheet"),
  about: document.querySelector(".about-sheet"),
  gutter: document.querySelector(".book-gutter"),
};
const hosts = {
  topAbove: document.querySelector(".cover-text-host--above"),
  topUnder: document.querySelector(".cover-text-host--under"),
  indexCover: document.querySelector(".index-host--cover"),
  indexAbove: document.querySelector(".index-host--above"),
  indexUnder: document.querySelector(".index-host--under"),
  aboutAbove: document.querySelector(".about-host--above"),
  aboutUnder: document.querySelector(".about-host--under"),
  gutterCover: document.querySelector(".gutter-host--cover"),
  gutterAbove: document.querySelector(".gutter-host--above"),
};

let page = 1;

function mount(el, host) {
  if (!el || !host) return;
  el.hidden = false;
  if (el.parentElement !== host) host.appendChild(el);
}

function layout() {
  if (!panels.top) return;
  mount(panels.top, page === 1 ? hosts.topAbove : hosts.topUnder);
  if (panels.index) {
    if (page === 1) mount(panels.index, hosts.indexCover);
    else if (page === 2) mount(panels.index, hosts.indexAbove);
    else mount(panels.index, hosts.indexUnder);
  }
  if (panels.about) {
    mount(panels.about, page === 3 ? hosts.aboutAbove : hosts.aboutUnder);
  }
  if (panels.gutter) {
    mount(panels.gutter, page === 1 ? hosts.gutterCover : hosts.gutterAbove);
  }
}

function setPage(n) {
  page = n;
  document.body.dataset.page = String(page);
  if (pageNum) pageNum.textContent = String(page);
  if (cover) cover.hidden = page !== 1;
  if (spread) spread.hidden = page === 1;
  layout();
  document.dispatchEvent(new CustomEvent("pagechange", { detail: { page } }));
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  if (t.closest(".jaquette")) {
    if (t.closest(".nav-index")) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("indexreset"));
      setPage(2);
    } else if (t.closest(".nav-about")) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("indexreset"));
      setPage(3);
    }
    return;
  }
  if (t.closest("a.index-entry") || t.closest(".gutter-contacts a")) return;
  if (page === 1) setPage(2);
});

setPage(1);
