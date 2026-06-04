(() => {
  const GUTTER_TOP_COUNT = 4;
  const GUTTER_CONTACTS_RESERVE = 160;
  const GUTTER_IMAGE_STEP = 72;

  const bookGutter = document.querySelector(".book-gutter");

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

  function createGutterFigure(project, filename, imageIndex) {
    const figure = document.createElement("figure");
    figure.className = "gutter-item";
    figure.dataset.imageIndex = String(imageIndex);
    figure.dataset.filename = filename;

    const img = document.createElement("img");
    img.className = "gutter-img";
    img.src = projectImageSrc(project, filename);
    img.alt = "";
    img.loading = "lazy";
    figure.append(img);

    return figure;
  }

  function renderImageGroup(host, items, startIndex = 0) {
    if (!host) return;
    host.replaceChildren();
    items.forEach((item, offset) => {
      host.appendChild(
        createGutterFigure(item.project, item.filename, startIndex + offset),
      );
    });
  }

  function setGutterHighlight(imageIndex) {
    document.querySelectorAll(".gutter-item").forEach((item) => {
      const index = Number(item.dataset.imageIndex);
      item.classList.toggle(
        "is-active",
        imageIndex >= 0 && index === imageIndex,
      );
    });
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
      GUTTER_IMAGE_STEP * GUTTER_TOP_COUNT,
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
    const partition = slug
      ? getPartition(slug)
      : fillPartitionToViewport(getPartition(null));

    renderImageGroup(topHost, partition.top, 0);
    renderImageGroup(bottomHost, partition.bottom, partition.top.length);

    bookGutter?.classList.toggle("is-project-sync", Boolean(slug));
    setGutterHighlight(slug ? 0 : -1);
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

  document.addEventListener("galleryimageactive", (event) => {
    if (!activeProjectSlug) return;
    const index = event.detail?.index;
    if (Number.isFinite(index)) setGutterHighlight(index);
  });

  document.addEventListener("indexreset", () => {
    renderGutter(null);
  });

  document.addEventListener("pagechange", (event) => {
    const nextPage = event.detail?.page;
    if (nextPage === 2 && !activeProjectSlug) {
      renderGutter(null);
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderGutter(activeProjectSlug), 150);
  });

  initGutter();
})();
