(() => {
  const MAX = 24;
  const tree = document.getElementById("history-tree");
  let bySlug = {};
  let visits = [];

  function render(list = visits) {
    if (!tree) return;
    if (!list.length) {
      tree.hidden = true;
      tree.replaceChildren();
      return;
    }
    tree.hidden = false;
    tree.replaceChildren(
      ...list.map((item) => {
        const li = document.createElement("li");
        li.className = "history-entry";
        const a = document.createElement("a");
        a.href = `#${item.slug}`;
        a.className = "history-entry-link";
        a.textContent = item.title;
        li.append(a);
        return li;
      }),
    );
  }

  function record(project) {
    if (!project?.slug) return;
    const entry = {
      id: project.id,
      slug: project.slug,
      title: project.title,
      practice: project.practice,
      at: Date.now(),
    };
    visits = visits.filter((v) => v.id !== entry.id);
    visits.push(entry);
    if (visits.length > MAX) visits = visits.slice(-MAX);
    render();
    document.dispatchEvent(new CustomEvent("projectvisit", { detail: { project: entry } }));
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const link = t.closest("a.index-entry, a.history-entry-link");
    if (!link) return;
    const slug = (link.id || link.getAttribute("href")?.replace(/^#/, "")) ?? "";
    const project = bySlug[slug];
    if (project) record(project);
  });

  window.recordProjectVisit = record;

  getProjectsData()
    .then((data) => {
      bySlug = Object.fromEntries(data.projects.map((p) => [p.slug, p]));
    })
    .catch((err) => console.error("history", err));
})();
