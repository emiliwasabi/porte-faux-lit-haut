(() => {
  const body = document.querySelector(".index-body");
  if (!body) return;

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
    return a;
  }

  getProjectsData()
    .then((data) => {
      const practices = Object.fromEntries((data.practices || []).map((x) => [x.id, x]));
      const list = data.projects
        .filter((project) => project.active !== false)
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        .map((project) => entry(project, practices[project.practice]));
      body.replaceChildren(...list);
    })
    .catch((err) => console.error("render-index", err));
})();
