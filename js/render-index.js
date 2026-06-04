(() => {
  const body = document.querySelector(".index-body");
  const legendHost = document.querySelector(".gutter-legend-host");
  if (!body || !legendHost) return;

  function practiceTag(practice, { inLegend = false } = {}) {
    const tag = document.createElement("span");
    tag.className =
      practice.style === "outline"
        ? "index-tag index-tag--outline"
        : "index-tag";
    if (!inLegend) {
      tag.setAttribute("aria-hidden", "true");
      tag.title = practice.label;
    }
    tag.textContent = (practice.code || practice.letter || "").toUpperCase();
    return tag;
  }

  function legendLetterTag(item) {
    const tag = document.createElement("span");
    tag.className =
      item.style === "outline" ? "index-tag index-tag--outline" : "index-tag";
    tag.textContent = String(item.letter || "").toUpperCase();
    return tag;
  }

  function legend(items) {
    const el = document.createElement("p");
    el.className = "index-legend";
    el.setAttribute("aria-label", "Practice legend");
    items.forEach((item, i) => {
      if (i) el.append(" ");
      const row = document.createElement("span");
      row.className = "index-legend__item";
      row.append(legendLetterTag(item), " = ", item.text || "");
      el.append(row);
    });
    return el;
  }

  function entry(project, practice) {
    const a = document.createElement("a");
    a.href = `#${project.slug}`;
    a.id = project.slug;
    a.className = "index-entry";
    a.dataset.practice = project.practice;
    a.title = practice
      ? `${project.title} — ${project.description} (${practice.label})`
      : `${project.title} — ${project.description}`;

    const title = document.createElement("span");
    title.className = "index-title";
    title.textContent = project.title;

    a.append(title);
    if (practice) a.append(" ", practiceTag(practice));
    return a;
  }

  getProjectsData()
    .then((data) => {
      const practices = Object.fromEntries((data.practices || []).map((x) => [x.id, x]));
      const list = data.projects.map((project) =>
        entry(project, practices[project.practice]),
      );
      body.replaceChildren(...list);
      legendHost.replaceChildren(legend(data.indexLegend || []));
    })
    .catch((err) => console.error("render-index", err));
})();
