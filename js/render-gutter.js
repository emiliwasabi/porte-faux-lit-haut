const GUTTER_TOP_COUNT = 4;
const GUTTER_CONTACTS_RESERVE = 160;
const GUTTER_IMAGE_STEP = 72;

let allProjects = [];
let activeProjectSlug = null;

function projectImageSrc(project, filename) {
  const folder = project.folder || `assets/projects/${project.slug}`;
  return `./${folder}/${filename}`;
}

function partitionGutterImages(projects) {
  const top = [];
  const bottom = [];

  for (const project of projects) {
    const files = project.images || [];
    if (!files.length) continue;

    if (top.length < GUTTER_TOP_COUNT) {
      top.push({ project, filename: files[0] });
      for (let i = 1; i < files.length; i += 1) {
        bottom.push({ project, filename: files[i] });
      }
    } else {
      for (const filename of files) {
        bottom.push({ project, filename });
      }
    }
  }

  return { top, bottom };
}

function partitionGutterImagesForProject(project) {
  const files = project.images || [];
  const items = files.map((filename) => ({ project, filename }));
  return {
    top: items.slice(0, GUTTER_TOP_COUNT),
    bottom: items.slice(GUTTER_TOP_COUNT),
  };
}

function createGutterFigure(project, filename) {
  const figure = document.createElement("figure");
  figure.className = "gutter-item";

  const img = document.createElement("img");
  img.className = "gutter-img";
  img.src = projectImageSrc(project, filename);
  img.alt = "";
  img.loading = "lazy";
  figure.append(img);

  return figure;
}

function renderImageGroup(host, items) {
  if (!host) return;
  host.replaceChildren();
  for (const { project, filename } of items) {
    host.appendChild(createGutterFigure(project, filename));
  }
}

function getPartition(slug) {
  if (slug) {
    const project = allProjects.find((item) => item.slug === slug);
    if (project) return partitionGutterImagesForProject(project);
  }
  return partitionGutterImages(allProjects);
}

function estimateMinImageCount() {
  const available = Math.max(
    window.innerHeight - GUTTER_CONTACTS_RESERVE,
    GUTTER_IMAGE_STEP * GUTTER_TOP_COUNT
  );
  return Math.ceil(available / GUTTER_IMAGE_STEP);
}

function repeatItemsToFill(items, minCount) {
  if (!items.length) return [];
  if (items.length >= minCount) return items;

  const filled = [];
  for (let i = 0; i < minCount; i += 1) {
    filled.push(items[i % items.length]);
  }
  return filled;
}

function fillPartitionToViewport(partition) {
  const flat = [...partition.top, ...partition.bottom];
  const filled = repeatItemsToFill(flat, estimateMinImageCount());
  return {
    top: filled.slice(0, GUTTER_TOP_COUNT),
    bottom: filled.slice(GUTTER_TOP_COUNT),
  };
}

function renderGutter(slug = activeProjectSlug) {
  const topHost = document.querySelector(".gutter-media--top");
  const bottomHost = document.querySelector(".gutter-media--bottom");
  if (!topHost || !bottomHost || !allProjects.length) return;

  activeProjectSlug = slug;
  const { top, bottom } = fillPartitionToViewport(getPartition(slug));

  renderImageGroup(topHost, top);
  renderImageGroup(bottomHost, bottom);
}

async function initGutter() {
  const topHost = document.querySelector(".gutter-media--top");
  const bottomHost = document.querySelector(".gutter-media--bottom");
  if (!topHost || !bottomHost) return;

  try {
    const response = await fetch("./data/projects.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    allProjects = data.projects || [];
    renderGutter(null);
  } catch (error) {
    console.error("Could not render gutter", error);
  }
}

document.addEventListener("projectvisit", (event) => {
  const project = event.detail?.project;
  if (project?.slug) renderGutter(project.slug);
});

document.addEventListener("pagechange", (event) => {
  const nextPage = event.detail?.page;
  if (nextPage === 2 && !activeProjectSlug) {
    renderGutter(null);
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest(".nav-index")) renderGutter(null);
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => renderGutter(activeProjectSlug), 150);
});

initGutter();
