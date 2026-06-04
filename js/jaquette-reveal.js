const jaquette = document.querySelector(".jaquette");

function isBookOpen() {
  const page = document.body.dataset.page;
  return page === "2" || page === "3";
}

function revealJaquette() {
  jaquette?.classList.add("is-revealed");
}

function hideJaquette() {
  jaquette?.classList.remove("is-revealed");
}

jaquette?.addEventListener("click", (event) => {
  if (!isBookOpen()) return;
  if (event.target.closest(".nav-links a")) return;
  event.stopPropagation();
  revealJaquette();
});

document.addEventListener("click", (event) => {
  if (!isBookOpen()) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest(".jaquette")) hideJaquette();
});

document.addEventListener("pagechange", () => {
  hideJaquette();
});
