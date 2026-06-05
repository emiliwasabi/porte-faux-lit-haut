(() => {
  const GUTTER_TOP = 4;
  const GUTTER_CONTACTS_H = 160;
  const GUTTER_STEP = 72;
  const INDEX_GUTTER_MAX = 16;

  const bookGutter = document.querySelector(".book-gutter");
  const galleryHost = document.querySelector(".project-gallery-host");
  const leftScroll = document.querySelector(".layer-scroll--left");
  const indexScroll = document.querySelector(".layer-scroll--index");
  const mobileReturn = document.querySelector(".mobile-return");

  let projects = [];
  let activeSlug = null;
  let galleryObserver = null;

  const bySlug = (slug) => projects.find((p) => p.slug === slug);

  function gutterPartitionIndex() {
    const items = [];
    for (const project of projects) {
      const files = project.images || [];
      if (!files.length) continue;
      items.push({ project, filename: files[0], imageIndex: 0 });
      if (items.length >= INDEX_GUTTER_MAX) break;
    }
    return {
      top: items.slice(0, GUTTER_TOP),
      bottom: items.slice(GUTTER_TOP),
    };
  }

  function gutterPartitionOne(project) {
    const files = project.images || [];
    const items = files.map((filename, imageIndex) => ({
      project,
      filename,
      imageIndex,
    }));
    return { top: items.slice(0, GUTTER_TOP), bottom: items.slice(GUTTER_TOP) };
  }

  function repeatToFill(items, min) {
    if (!items.length) return [];
    if (items.length >= min) return items;
    return Array.from({ length: min }, (_, i) => items[i % items.length]);
  }

  function fillGutter(partition, forProject) {
    if (!forProject) return partition;

    const flat = [...partition.top, ...partition.bottom];
    const min = Math.ceil(
      Math.max(
        window.innerHeight - GUTTER_CONTACTS_H,
        GUTTER_STEP * GUTTER_TOP,
      ) / GUTTER_STEP,
    );
    const filled = repeatToFill(flat, min);
    return {
      top: filled.slice(0, GUTTER_TOP),
      bottom: filled.slice(GUTTER_TOP),
    };
  }

  function appendMedia(
    fig,
    project,
    filename,
    className,
    { eager, high, sizes },
  ) {
    const url = projectImageSrc(project, filename);
    if (isVideoMedia(filename)) {
      const video = document.createElement("video");
      video.className = className;
      video.setAttribute("aria-hidden", "true");
      assignProjectMedia(video, url, { eager, high });
      fig.append(video);
      return;
    }
    const img = document.createElement("img");
    img.className = className;
    img.alt = "";
    assignProjectMedia(img, url, { eager, high, sizes });
    fig.append(img);
  }

  function gutterFigure(item, eager) {
    const fig = document.createElement("figure");
    fig.className = "gutter-item";
    fig.dataset.imageIndex = String(item.imageIndex);
    fig.dataset.slug = item.project.slug;
    appendMedia(fig, item.project, item.filename, "gutter-img", {
      eager,
      sizes: "var(--gutter-width)",
    });
    return fig;
  }

  function renderGutterGroup(host, items, eagerCount = 0) {
    host.replaceChildren();
    items.forEach((item, i) => host.append(gutterFigure(item, i < eagerCount)));
  }

  function setGutterHighlight(index) {
    document.querySelectorAll(".gutter-item").forEach((el) => {
      el.classList.toggle(
        "is-active",
        index >= 0 && Number(el.dataset.imageIndex) === index,
      );
    });
  }

  function scrollToGalleryImage(index) {
    if (!galleryHost || !activeSlug || !Number.isFinite(index)) return;
    const target = galleryHost.querySelector(
      `.project-gallery__item[data-image-index="${index}"]`,
    );
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setGutterHighlight(index);
  }

  function renderGutter(slug = activeSlug) {
    const top = document.querySelector(".gutter-media--top");
    const bottom = document.querySelector(".gutter-media--bottom");
    if (!top || !bottom || !projects.length) return;

    activeSlug = slug;
    const partition = slug
      ? gutterPartitionOne(bySlug(slug))
      : gutterPartitionIndex();
    const part = fillGutter(partition, Boolean(slug));
    const eager = slug ? 2 : 1;
    renderGutterGroup(top, part.top, eager);
    renderGutterGroup(
      bottom,
      part.bottom,
      Math.max(0, eager - part.top.length),
    );
    bookGutter?.classList.toggle("is-project-sync", Boolean(slug));
    bookGutter?.classList.toggle("is-index-mix", !slug);
    setGutterHighlight(slug ? 0 : -1);
  }

  function renderGallery(slug) {
    if (!galleryHost) return;
    if (!slug) {
      activeSlug = null;
      galleryHost.hidden = true;
      galleryHost.replaceChildren();
      galleryObserver?.disconnect();
      galleryObserver = null;
      return;
    }

    const project = bySlug(slug);
    if (!project?.images?.length) {
      renderGallery(null);
      return;
    }

    activeSlug = slug;
    const wrap = document.createElement("div");
    wrap.className = "project-gallery";
    project.images.forEach((filename, i) => {
      const fig = document.createElement("figure");
      fig.className = "project-gallery__item";
      fig.dataset.imageIndex = String(i);
      appendMedia(fig, project, filename, "project-gallery__media", {
        eager: i === 0,
        high: i === 0,
        sizes: "(max-width: 900px) 100vw, 50vw",
      });
      wrap.append(fig);
    });
    galleryHost.replaceChildren(wrap);
    galleryHost.hidden = false;
    preloadProjectImages(project, 2);
    leftScroll && (leftScroll.scrollTop = 0);

    galleryObserver?.disconnect();
    if (!leftScroll) return;
    galleryObserver = new IntersectionObserver(
      (records) => {
        let best = null;
        let bestR = 0;
        for (const r of records) {
          if (r.intersectionRatio > bestR) {
            bestR = r.intersectionRatio;
            best = r.target;
          }
        }
        if (best?.dataset.imageIndex != null && bestR > 0.35) {
          document.dispatchEvent(
            new CustomEvent("galleryimageactive", {
              detail: { index: Number(best.dataset.imageIndex) },
            }),
          );
        }
      },
      {
        root: leftScroll,
        threshold: [0, 0.35, 0.5, 0.65, 0.8, 1],
        rootMargin: "-8% 0px -8% 0px",
      },
    );
    galleryHost.querySelectorAll(".project-gallery__item").forEach((el) => {
      galleryObserver.observe(el);
    });
    document.dispatchEvent(
      new CustomEvent("galleryimageactive", { detail: { index: 0 } }),
    );
  }

  function syncProjectState() {
    if (activeSlug && document.body.dataset.page === "2") {
      document.body.setAttribute("data-project", activeSlug);
    } else {
      document.body.removeAttribute("data-project");
    }
    if (mobileReturn) {
      mobileReturn.hidden = !(activeSlug && document.body.dataset.page === "2");
    }
  }

  function onProjectVisit(slug) {
    const project = bySlug(slug);
    if (project) preloadProjectImages(project, 2);
    renderGutter(slug);
    renderGallery(slug);
    syncProjectState();
  }

  function resetIndex() {
    activeSlug = null;
    renderGallery(null);
    renderGutter(null);
    indexScroll?.scrollTo({ top: 0, behavior: "smooth" });
    leftScroll && (leftScroll.scrollTop = 0);
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    syncProjectState();
  }

  document.addEventListener("projectvisit", (e) => {
    if (e.detail?.project?.slug) onProjectVisit(e.detail.project.slug);
  });
  document.addEventListener("galleryimageactive", (e) => {
    if (activeSlug && Number.isFinite(e.detail?.index))
      setGutterHighlight(e.detail.index);
  });
  document.addEventListener("indexreset", resetIndex);
  mobileReturn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.dispatchEvent(new CustomEvent("indexreset"));
  });
  bookGutter?.addEventListener("click", (e) => {
    if (document.body.dataset.page !== "2") return;
    const item = e.target.closest(".gutter-item");
    if (!item?.dataset.slug) return;

    e.preventDefault();
    e.stopPropagation();

    if (activeSlug) {
      scrollToGalleryImage(Number(item.dataset.imageIndex));
      return;
    }

    const project = bySlug(item.dataset.slug);
    if (!project) return;
    history.pushState(null, "", `#${project.slug}`);
    window.recordProjectVisit?.(project);
  });
  document.addEventListener("pagechange", (e) => {
    const p = e.detail?.page;
    if (p !== 2) renderGallery(null);
    if (p === 3) {
      activeSlug = null;
      renderGutter(null);
    } else if (p === 2 && !activeSlug) renderGutter(null);
    syncProjectState();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderGutter(activeSlug), 150);
  });

  getProjectsData()
    .then((data) => {
      projects = data.projects || [];
      renderGutter(null);
      syncProjectState();
    })
    .catch((err) => console.error("project-media", err));
})();
