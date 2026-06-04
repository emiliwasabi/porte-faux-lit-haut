(() => {
  const galleryHost = document.querySelector(".project-gallery-host");
  const leftScroll = document.querySelector(".layer-scroll--left");
  const indexScroll = document.querySelector(".layer-scroll--index");

  let projectBySlug = {};
  let activeSlug = null;
  let galleryImageObserver = null;

  function projectImageSrc(project, filename) {
    const folder = project.folder || `assets/projects/${project.slug}`;
    return `./${folder}/${filename}`;
  }

  function dispatchGalleryImageActive(index) {
    document.dispatchEvent(
      new CustomEvent("galleryimageactive", { detail: { index } }),
    );
  }

  function disconnectGalleryObserver() {
    if (galleryImageObserver) {
      galleryImageObserver.disconnect();
      galleryImageObserver = null;
    }
  }

  function observeGalleryImages() {
    disconnectGalleryObserver();
    if (!leftScroll || !activeSlug || !galleryHost) return;

    const items = galleryHost.querySelectorAll(".project-gallery__item");
    if (!items.length) return;

    galleryImageObserver = new IntersectionObserver(
      (records) => {
        if (!activeSlug) return;

        let best = null;
        let bestRatio = 0;

        for (const record of records) {
          if (record.intersectionRatio > bestRatio) {
            bestRatio = record.intersectionRatio;
            best = record.target;
          }
        }

        if (best?.dataset.imageIndex != null && bestRatio > 0.35) {
          dispatchGalleryImageActive(Number(best.dataset.imageIndex));
        }
      },
      {
        root: leftScroll,
        threshold: [0, 0.35, 0.5, 0.65, 0.8, 1],
        rootMargin: "-8% 0px -8% 0px",
      },
    );

    items.forEach((item) => galleryImageObserver.observe(item));
  }

  function renderProjectGallery(slug) {
    if (!galleryHost) return;

    if (!slug) {
      activeSlug = null;
      galleryHost.hidden = true;
      galleryHost.replaceChildren();
      disconnectGalleryObserver();
      return;
    }

    const project = projectBySlug[slug];
    if (!project?.images?.length) {
      renderProjectGallery(null);
      return;
    }

    activeSlug = slug;
    const gallery = document.createElement("div");
    gallery.className = "project-gallery";

    project.images.forEach((filename, imageIndex) => {
      const figure = document.createElement("figure");
      figure.className = "project-gallery__item";
      figure.dataset.imageIndex = String(imageIndex);
      figure.dataset.filename = filename;

      const img = document.createElement("img");
      img.className = "project-gallery__img";
      img.src = projectImageSrc(project, filename);
      img.alt = "";
      img.loading = "lazy";

      figure.append(img);
      gallery.append(figure);
    });

    galleryHost.replaceChildren(gallery);
    galleryHost.hidden = false;

    if (leftScroll) leftScroll.scrollTop = 0;
    observeGalleryImages();
    dispatchGalleryImageActive(0);
  }

  function resetToIndex() {
    activeSlug = null;
    renderProjectGallery(null);
    indexScroll?.scrollTo({ top: 0, behavior: "smooth" });
    leftScroll?.scrollTo({ top: 0 });

    const base = `${window.location.pathname}${window.location.search}`;
    history.replaceState(null, "", base);
  }

  async function initProjectGallery() {
    if (!galleryHost) return;

    try {
      const response = await fetch("./data/projects.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      projectBySlug = Object.fromEntries(
        (data.projects || []).map((project) => [project.slug, project]),
      );
    } catch (error) {
      console.error("Could not render project gallery", error);
    }
  }

  document.addEventListener("projectvisit", (event) => {
    const slug = event.detail?.project?.slug;
    if (slug) renderProjectGallery(slug);
  });

  document.addEventListener("indexreset", () => {
    resetToIndex();
  });

  document.addEventListener("pagechange", (event) => {
    const nextPage = event.detail?.page;
    if (nextPage !== 2) {
      renderProjectGallery(null);
    }
  });

  initProjectGallery();
})();
