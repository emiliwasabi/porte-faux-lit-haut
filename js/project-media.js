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
  const projectDescription = document.querySelector(".project-description");
  const lightbox = document.querySelector(".media-lightbox");
  const lightboxStage = lightbox?.querySelector(".media-lightbox__stage");
  const lightboxPrevious = lightbox?.querySelector(".media-lightbox__previous");
  const lightboxNext = lightbox?.querySelector(".media-lightbox__next");

  let projects = [];
  let activeSlug = null;
  let galleryObserver = null;
  let lightboxIndex = 0;

  function closeLightbox() {
    if (!lightbox || !lightboxStage) return;
    lightbox.hidden = true;
    lightboxStage.replaceChildren();
  }

  function showLightboxMedia(index, direction = 0) {
    const project = bySlug(activeSlug);
    if (!project?.images?.length || !lightbox || !lightboxStage) return;
    lightboxIndex = (index + project.images.length) % project.images.length;
    const filename = project.images[lightboxIndex];
    const url = projectImageSrc(project, filename);
    const media = isVideoMedia(filename)
      ? document.createElement("video")
      : document.createElement("img");
    media.className = "media-lightbox__media";
    if (direction > 0) media.classList.add("media-lightbox__media--from-right");
    if (direction < 0) media.classList.add("media-lightbox__media--from-left");
    media.src = url;
    if (media instanceof HTMLVideoElement) {
      media.controls = true;
      media.autoplay = true;
      media.loop = true;
      media.playsInline = true;
    } else {
      media.alt = project.title;
    }
    lightboxStage.replaceChildren(media);
    lightbox.hidden = false;
    lightboxPrevious.disabled = project.images.length < 2;
    lightboxNext.disabled = project.images.length < 2;
  }

  const bySlug = (slug) => projects.find((p) => p.slug === slug);

  function shuffleArray(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function gutterPartitionIndex() {
    const indexProjects = projects.filter((project) => project.active !== false);
    const items = [];
    for (const project of shuffleArray(indexProjects)) {
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
    const isThesis = slug === "thesis-draft";
    const partition = isThesis
      ? gutterPartitionIndex()
      : slug
        ? gutterPartitionOne(bySlug(slug))
        : gutterPartitionIndex();
    const part = fillGutter(partition, true);
    const eager = slug && !isThesis ? 2 : 1;
    renderGutterGroup(top, part.top, eager);
    renderGutterGroup(
      bottom,
      part.bottom,
      Math.max(0, eager - part.top.length),
    );
    bookGutter?.classList.toggle("is-project-sync", Boolean(slug) && !isThesis);
    bookGutter?.classList.toggle("is-index-mix", !slug || isThesis);
    setGutterHighlight(slug && !isThesis ? 0 : -1);
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function formatChapterLabel(line) {
    const match = String(line).trim().match(/^([IVXLC]+)(?:\.\s*|\s+)(.+)$/);
    if (!match) return String(line).trim();
    const numeral = match[1];
    const title = match[2].trim();
    if (!title) return `${numeral}.`;
    return `${numeral}. ${title}`;
  }

  async function renderProjectText(project, host) {
    if (!host || !project?.textFile) return;

    const fileUrl = `./${project.folder}/${project.textFile}`;
    let text = project.description || "";

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      text = await response.text();
    } catch (error) {
      console.error("project-text", error);
    }

    const block = document.createElement("article");
    block.className = "project-text";

    const lines = (text || "")
      .replace(/\r/g, "")
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!lines.length) {
      host.replaceChildren(block);
      host.hidden = false;
      return;
    }

    const title = document.createElement("h2");
    title.className = "project-text__title";
    title.textContent = lines[0] || project.title;

    const subtitle = document.createElement("p");
    subtitle.className = "project-text__subtitle";
    subtitle.textContent = lines[1] || project.description || "";

    const intro = document.createElement("nav");
    intro.className = "project-text__index";
    const chapterMatches = [];
    const chapterPattern = /^([IVXLC]+)(?:\.\s*|\s+)(.+)$/;

    lines.slice(2).forEach((line) => {
      const match = line.match(chapterPattern);
      if (match) {
        const titleText = match[2].trim();
        const label = formatChapterLabel(line);
        chapterMatches.push({
          id: slugify(titleText),
          label,
        });
      }
    });

    if (chapterMatches.length) {
      const list = document.createElement("ol");
      list.className = "project-text__index-list";
      chapterMatches.forEach((chapter) => {
        const item = document.createElement("li");
        item.className = "project-text__index-item";
        const link = document.createElement("a");
        link.href = `#${chapter.id}`;
        link.className = "project-text__index-link";
        link.textContent = chapter.label;
        item.append(link);
        list.append(item);
      });
      intro.append(list);
    }

    const body = document.createElement("div");
    body.className = "project-text__body";

    const contentLines = (text || "")
      .replace(/\r/g, "")
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const titleValue = contentLines[0] || project.title;
    const subtitleValue = contentLines[1] || project.description || "";
    const bodyLines = contentLines.slice(2);
    const planIndex = bodyLines.findIndex((line) => /^\(plan:\)$|^plan:?$/i.test(line));
    const trimmedBodyLines = planIndex >= 0 ? bodyLines.slice(0, planIndex) : bodyLines;
    const firstChapterIndex = trimmedBodyLines.findIndex((line) => /^([IVXLC]+)\.?\s+/.test(line));
    const introLines = firstChapterIndex >= 0 ? trimmedBodyLines.slice(0, firstChapterIndex) : trimmedBodyLines;
    const chapterLines = firstChapterIndex >= 0 ? trimmedBodyLines.slice(firstChapterIndex) : [];

    const renderMetaLineGroup = (lines, container) => {
      const label = lines[0] || "";
      const meta = document.createElement("p");
      meta.className = "project-text__meta";
      meta.textContent = label;
      container.append(meta);

      const rest = lines.slice(1).join(" ");
      if (rest) {
        const para = document.createElement("p");
        para.className = "project-text__paragraph";
        para.textContent = rest.replace(/\s+/g, " ").trim();
        container.append(para);
      }
    };

    const renderParagraphGroup = (lines, container) => {
      const para = document.createElement("p");
      para.className = "project-text__paragraph";
      para.textContent = lines.join(" ").replace(/\s+/g, " ").trim();
      container.append(para);
    };

    const renderChapterLineGroup = (lines, container) => {
      const firstLine = lines[0] || "";
      const chapterMatch = firstLine.match(/^([IVXLC]+)\.?\s*(.+)$/);
      if (!chapterMatch) {
        renderParagraphGroup(lines, container);
        return;
      }

      const heading = document.createElement("h3");
      heading.className = "project-text__chapter";
      const chapterText = chapterMatch[2].trim();
      heading.id = slugify(chapterText);
      heading.textContent = formatChapterLabel(firstLine);
      container.append(heading);

      const rest = lines.slice(1).join(" ");
      if (rest) {
        const para = document.createElement("p");
        para.className = "project-text__paragraph";
        para.textContent = rest.replace(/\s+/g, " ").trim();
        container.append(para);
      }
    };

    let i = 0;
    while (i < introLines.length) {
      const line = introLines[i];
      if (!line) {
        i += 1;
        continue;
      }

      if (/^\(.*:\)$/i.test(line)) {
        const group = [line];
        i += 1;
        while (i < introLines.length && !/^\(.*:\)$/i.test(introLines[i]) && !/^([IVXLC]+)\.?\s+/.test(introLines[i])) {
          group.push(introLines[i]);
          i += 1;
        }
        renderMetaLineGroup(group, body);
        continue;
      }

      const group = [line];
      i += 1;
      while (i < introLines.length && !/^\(.*:\)$/i.test(introLines[i]) && !/^([IVXLC]+)\.?\s+/.test(introLines[i])) {
        group.push(introLines[i]);
        i += 1;
      }
      renderParagraphGroup(group, body);
    }

    if (chapterLines.length) {
      const chapterMatches = [];
      chapterLines.forEach((line) => {
        const match = line.match(/^([IVXLC]+)\.?\s*(.+)$/);
        if (match) {
          chapterMatches.push({
            id: slugify(match[2].trim()),
            label: `${match[1]}. ${match[2].trim()}`,
          });
        }
      });

      if (chapterMatches.length) {
        const list = document.createElement("ol");
        list.className = "project-text__index-list";
        chapterMatches.forEach((chapter) => {
          const item = document.createElement("li");
          item.className = "project-text__index-item";
          const link = document.createElement("a");
          link.href = `#${chapter.id}`;
          link.className = "project-text__index-link";
          link.textContent = chapter.label;
          item.append(link);
          list.append(item);
        });
        intro.replaceChildren(list);
      }
    }

    let chapterIndex = 0;
    while (chapterIndex < chapterLines.length) {
      const line = chapterLines[chapterIndex];
      if (!line) {
        chapterIndex += 1;
        continue;
      }
      const group = [line];
      chapterIndex += 1;
      while (chapterIndex < chapterLines.length && !/^([IVXLC]+)\.?\s+/.test(chapterLines[chapterIndex])) {
        group.push(chapterLines[chapterIndex]);
        chapterIndex += 1;
      }
      renderChapterLineGroup(group, body);
    }

    title.textContent = titleValue;
    subtitle.textContent = subtitleValue;
    block.append(title, subtitle, body, intro);
    host.replaceChildren(block);
    host.hidden = false;
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
    if (!project) {
      renderGallery(null);
      return;
    }

    activeSlug = slug;
    if (!project.images?.length) {
      galleryHost.hidden = !project.textFile;
      galleryHost.replaceChildren();
      galleryObserver?.disconnect();
      galleryObserver = null;
      leftScroll && (leftScroll.scrollTop = 0);
      if (project.textFile && project.slug === "thesis-draft") {
        window.renderThesisProjectText?.(project, galleryHost).catch((error) => console.error("project-text", error));
      } else if (project.textFile) {
        renderProjectText(project, galleryHost).catch((error) => console.error("project-text", error));
      }
      return;
    }

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

  galleryHost?.addEventListener("click", (event) => {
    const media = event.target.closest(".project-gallery__media");
    if (!media || !activeSlug) return;
    event.preventDefault();
    event.stopPropagation();
    showLightboxMedia(Number(media.closest(".project-gallery__item")?.dataset.imageIndex));
  });

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightboxStage?.addEventListener("click", (event) => event.stopPropagation());
  lightboxPrevious?.addEventListener("click", () => showLightboxMedia(lightboxIndex - 1, -1));
  lightboxNext?.addEventListener("click", () => showLightboxMedia(lightboxIndex + 1, 1));
  document.addEventListener("keydown", (event) => {
    if (lightbox?.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showLightboxMedia(lightboxIndex - 1, -1);
    if (event.key === "ArrowRight") showLightboxMedia(lightboxIndex + 1, 1);
  });

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
    if (projectDescription) {
      const shouldHide = project?.slug === "thesis-draft";
      projectDescription.textContent = shouldHide ? "" : project?.description || "";
      projectDescription.hidden = shouldHide || !project?.description;
    }
    renderGutter(slug);
    renderGallery(slug);
    syncProjectState();
  }

  function resetIndex() {
    activeSlug = null;
    closeLightbox();
    if (projectDescription) {
      projectDescription.textContent = "";
      projectDescription.hidden = true;
    }
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
      projects = (data.projects || []).sort(
        (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
      );
      renderGutter(null);
      syncProjectState();
    })
    .catch((err) => console.error("project-media", err));
})();
