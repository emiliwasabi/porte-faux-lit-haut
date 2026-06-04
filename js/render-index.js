(() => {
  const body = document.querySelector(".index-body");
  if (!body) return;

  function marker(practice) {
    const s = document.createElement("span");
    s.className =
      practice.style === "outline"
        ? "index-marker index-marker--outline"
        : "index-marker";
    s.setAttribute("aria-hidden", "true");
    s.title = practice.label;
    s.textContent = practice.letter;
    return s;
  }

  function entry(project, practice, showMarker) {
    const a = document.createElement("a");
    a.href = `#${project.slug}`;
    a.id = project.slug;
    a.className = `index-entry indent-${project.indent}`;
    a.dataset.practice = project.practice;
    if (showMarker && practice) a.append(marker(practice));
    const p = document.createElement("p");
    p.className = "index-desc";
    p.innerHTML = `<span class="index-title">${project.title}</span> — ${project.description}`;
    a.append(p);
    return a;
  }

  getProjectsData()
    .then((data) => {
      const practices = Object.fromEntries((data.practices || []).map((x) => [x.id, x]));
      let prev = null;
      body.replaceChildren(
        ...data.projects.map((project) => {
          const show = project.practice !== prev;
          prev = project.practice;
          return entry(project, practices[project.practice], show);
        }),
      );
    })
    .catch((err) => console.error("render-index", err));
})();
