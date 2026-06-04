function createPracticeMarker(practice) {
  const span = document.createElement("span");
  span.className =
    practice.style === "outline"
      ? "index-marker index-marker--outline"
      : "index-marker";
  span.setAttribute("aria-hidden", "true");
  span.title = practice.label;
  span.textContent = practice.letter;
  return span;
}

function createProjectEntry(project, practice, showMarker) {
  const link = document.createElement("a");
  link.href = `#${project.slug}`;
  link.id = project.slug;
  link.className = `index-entry indent-${project.indent}`;
  link.dataset.practice = project.practice;

  if (showMarker && practice) {
    link.appendChild(createPracticeMarker(practice));
  }

  const desc = document.createElement("p");
  desc.className = "index-desc";
  desc.innerHTML = `<span class="index-title">${project.title}</span> — ${project.description}`;

  link.append(desc);
  return link;
}

async function renderProjectIndex() {
  const indexBody = document.querySelector(".index-body");
  if (!indexBody) return;

  try {
    const data = await getProjectsData();
    const practiceById = Object.fromEntries(
      (data.practices || []).map((item) => [item.id, item])
    );

    indexBody.replaceChildren();

    let previousPracticeId = null;

    for (const project of data.projects) {
      const practice = practiceById[project.practice];
      const showMarker = project.practice !== previousPracticeId;
      indexBody.appendChild(createProjectEntry(project, practice, showMarker));
      previousPracticeId = project.practice;
    }
  } catch (error) {
    console.error("Could not load projects.json", error);
  }
}

renderProjectIndex();
