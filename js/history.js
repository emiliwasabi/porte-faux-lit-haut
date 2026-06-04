const MAX_ENTRIES = 24;

const historyTree = document.getElementById("history-tree");

let projectBySlug = {};
let visitHistory = [];

function recordVisit(project) {
  if (!project?.slug) return;

  const entry = {
    id: project.id,
    slug: project.slug,
    title: project.title,
    practice: project.practice,
    at: Date.now(),
  };

  visitHistory = visitHistory.filter((item) => item.id !== entry.id);
  visitHistory.push(entry);

  if (visitHistory.length > MAX_ENTRIES) {
    visitHistory = visitHistory.slice(-MAX_ENTRIES);
  }

  renderHistory();
  document.dispatchEvent(
    new CustomEvent("projectvisit", { detail: { project: entry } }),
  );
}

function renderHistory(history = visitHistory) {
  if (!historyTree) return;

  if (history.length === 0) {
    historyTree.hidden = true;
    historyTree.replaceChildren();
    return;
  }

  historyTree.hidden = false;
  historyTree.replaceChildren();

  for (const item of history) {
    const li = document.createElement("li");
    li.className = "history-entry";

    const link = document.createElement("a");
    link.href = `#${item.slug}`;
    link.className = "history-entry-link";
    link.textContent = item.title;

    li.append(link);
    historyTree.append(li);
  }
}

async function loadProjects() {
  try {
    const data = await getProjectsData();
    projectBySlug = Object.fromEntries(
      data.projects.map((project) => [project.slug, project]),
    );
  } catch (error) {
    console.error("Could not load projects for history", error);
  }
}

function visitFromClick(target) {
  const indexEntry = target.closest("a.index-entry");
  if (indexEntry?.id) {
    const project = projectBySlug[indexEntry.id];
    if (project) recordVisit(project);
    return;
  }

  const historyLink = target.closest("a.history-entry-link");
  if (!historyLink) return;

  const slug = historyLink.getAttribute("href")?.replace(/^#/, "");
  const project = slug ? projectBySlug[slug] : null;
  if (project) recordVisit(project);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  visitFromClick(target);
});

window.recordProjectVisit = recordVisit;

loadProjects();
