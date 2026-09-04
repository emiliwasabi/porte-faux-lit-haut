(() => {
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
    return title ? `${numeral}. ${title}` : `${numeral}.`;
  }

  function resolveMediaPath(reference, project) {
    const value = String(reference).trim();
    if (!value) return "";
    if (/^(?:https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("./") || value.startsWith("/")) {
      return value;
    }
    if (value.startsWith("../")) {
      return `./assets/projects/${value.replace(/^\.\.\//, "")}`;
    }
    if (value.startsWith("thesisimages/")) {
      return `./assets/projects/${value}`;
    }
    if (value.includes("/")) {
      return `./${value.replace(/^\/+/, "")}`;
    }
    return `./assets/projects/thesisimages/${value}`;
  }

  function renderMediaReference(reference, project, container) {
    const value = String(reference).trim();
    if (!value) return;

    const mediaPath = resolveMediaPath(value, project);
    const figure = document.createElement("figure");
    figure.className = "project-text__figure";

    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaPath);
    const isPdf = /\.pdf$/i.test(mediaPath);

    if (isPdf) {
      const embed = document.createElement("object");
      embed.className = "project-text__media project-text__media--pdf";
      embed.type = "application/pdf";
      embed.data = mediaPath;
      embed.title = project.title;
      figure.append(embed);
      container.append(figure);
      return;
    }

    const media = isVideo ? document.createElement("video") : document.createElement("img");
    media.className = "project-text__media";
    media.src = mediaPath;
    media.alt = project.title;

    if (isVideo) {
      media.controls = true;
      media.muted = true;
      media.playsInline = true;
      media.loop = true;
      media.autoplay = true;
    }

    figure.append(media);
    container.append(figure);
  }

  function renderTextParagraph(text, container, project, referencePanel) {
    const para = document.createElement("p");
    para.className = "project-text__paragraph";
    const content = String(text).replace(/\s+/g, " ").trim();
    const refPattern = /\[([^\]]+)\]\(([^|)]+)(?:\|([^)]*))?\)/g;
    const hasReference = refPattern.test(content);
    refPattern.lastIndex = 0;

    if (!hasReference) {
      para.textContent = content;
      container.append(para);
      return;
    }

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    let activeReference = null;
    let pinnedReference = null;

    const showReference = (reference, imageValue, legendValue) => {
      const media = resolveMediaPath(imageValue, project);
      const image = referencePanel.querySelector(".project-text__reference-panel-image");
      const legend = referencePanel.querySelector(".project-text__reference-panel-legend");
      if (image) {
        image.src = media;
        image.alt = legendValue;
      }
      if (legend) {
        legend.textContent = legendValue;
      }
      activeReference = reference;
      referencePanel.hidden = false;
      requestAnimationFrame(() => {
        referencePanel.classList.add("is-visible");
      });
    };

    const hideReference = (reference) => {
      if (activeReference !== reference || pinnedReference === reference) return;
      referencePanel.classList.remove("is-visible");
      setTimeout(() => {
        if (activeReference === reference && pinnedReference !== reference && !referencePanel.matches(":hover")) {
          activeReference = null;
          referencePanel.hidden = true;
        }
      }, 120);
    };

    const toggleReference = (reference, imageValue, legendValue) => {
      if (pinnedReference === reference) {
        pinnedReference = null;
        activeReference = null;
        referencePanel.classList.remove("is-visible");
        referencePanel.hidden = true;
        return;
      }
      pinnedReference = reference;
      activeReference = reference;
      showReference(reference, imageValue, legendValue);
    };

    while ((match = refPattern.exec(content))) {
      if (match.index > lastIndex) {
        fragment.append(document.createTextNode(content.slice(lastIndex, match.index)));
      }

      const label = match[1].trim();
      const imageValue = match[2].trim();
      const legendValue = (match[3] || label).trim();
      const reference = document.createElement("span");
      reference.className = "project-text__reference";
      reference.textContent = label;
      reference.tabIndex = 0;

      reference.addEventListener("mouseenter", () => showReference(reference, imageValue, legendValue));
      reference.addEventListener("focus", () => showReference(reference, imageValue, legendValue));
      reference.addEventListener("mouseleave", () => hideReference(reference));
      reference.addEventListener("blur", () => hideReference(reference));
      reference.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleReference(reference, imageValue, legendValue);
      });

      fragment.append(reference);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      fragment.append(document.createTextNode(content.slice(lastIndex)));
    }

    para.append(fragment);
    container.append(para);
  }

  function renderMetaLabel(text, container) {
    const meta = document.createElement("p");
    meta.className = "project-text__meta";
    meta.textContent = String(text).trim();
    container.append(meta);
  }

  function renderChapterHeading(line, container) {
    const chapterMatch = String(line).trim().match(/^([IVXLC]+)(?:\.\s*|\s+)(.+)$/);
    if (!chapterMatch) {
      renderTextParagraph(line, container); 
      return;
    }

    const heading = document.createElement("h3");
    heading.className = "project-text__chapter";
    const chapterText = chapterMatch[2].trim();
    heading.id = slugify(chapterText);
    heading.textContent = formatChapterLabel(line);
    container.append(heading);
  }

  async function renderThesisProjectText(project, host) {
    if (!host || !project?.textFile) return;

    const fileUrl = `./${project.folder}/${project.textFile}`;
    let text = project.description || "";

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      text = await response.text();
    } catch (error) {
      console.error("thesis-text", error);
    }

    const block = document.createElement("article");
    block.className = "project-text";

    const allLines = (text || "")
      .replace(/\r/g, "")
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const planIndex = allLines.findIndex((line) => /^\(plan:\)$|^plan:?$/i.test(line));
    const contentLines = planIndex >= 0 ? allLines.slice(0, planIndex) : allLines;

    if (!contentLines.length) {
      host.replaceChildren(block);
      host.hidden = false;
      return;
    }

    const title = document.createElement("h2");
    title.className = "project-text__title";
    title.textContent = contentLines[0] || project.title;

    const subtitle = document.createElement("p");
    subtitle.className = "project-text__subtitle";

    const subtitleText = String(contentLines[1] || project.description || "").trim();
    const subtitleHtml = subtitleText.replace(/^(Gathering as practice:)(\s+.+)$/i, "$1<br>$2");
    subtitle.innerHTML = subtitleHtml || subtitleText;

    const header = document.createElement("header");
    header.className = "project-text__header";
    header.append(title);

    const firstChapterIndex = contentLines.findIndex((line) => /^([IVXLC]+)(?:\.\s*|\s+)(.+)$/.test(line));
    const introMedia = document.createElement("div");
    introMedia.className = "project-text__intro-media";

    let introImageAdded = false;
    for (let i = 2; i < contentLines.length && i < firstChapterIndex; i += 1) {
      const line = contentLines[i];
      const mediaMatch = line.match(/^\(image:\s*(.+?)\s*\)$/i) || line.match(/^\(chapter-image:\s*(.+?)\s*\)$/i);
      if (mediaMatch) {
        renderMediaReference(mediaMatch[1], project, introMedia);
        introImageAdded = true;
      }
    }

    if (!introImageAdded && firstChapterIndex > -1) {
      renderMediaReference("gardening2.png", project, introMedia);
    }

    const chapterBlock = document.createElement("div");
    chapterBlock.className = "project-text__chapter-block";

    const referencePanel = document.createElement("aside");
    referencePanel.className = "project-text__reference-panel";
    referencePanel.hidden = true;
    const image = document.createElement("img");
    image.className = "project-text__reference-panel-image";
    image.alt = "Reference";
    const legend = document.createElement("p");
    legend.className = "project-text__reference-panel-legend";
    referencePanel.append(image, legend);

    const chapterLines = firstChapterIndex >= 0 ? contentLines.slice(firstChapterIndex) : [];
    for (const line of chapterLines) {
      if (!line) continue;
      if (/^\(.*:\)$/i.test(line)) {
        renderMetaLabel(line, chapterBlock);
        continue;
      }
      if (/^([IVXLC]+)(?:\.\s*|\s+)(.+)$/.test(line)) {
        renderChapterHeading(line, chapterBlock);
        continue;
      }
      const mediaMatch = line.match(/^\(image:\s*(.+?)\s*\)$/i) || line.match(/^\(chapter-image:\s*(.+?)\s*\)$/i);
      if (mediaMatch) {
        renderMediaReference(mediaMatch[1], project, chapterBlock);
        continue;
      }
      renderTextParagraph(line, chapterBlock, project, referencePanel);
    }

    const leftScroll = document.querySelector(".layer-scroll--left");
    if (leftScroll) {
      const revealChapterBlock = () => {
        const shouldReveal = leftScroll.scrollTop > 420;
        chapterBlock.classList.toggle("is-visible", shouldReveal);
      };
      if (leftScroll.__thesisRevealHandler) {
        leftScroll.removeEventListener("scroll", leftScroll.__thesisRevealHandler);
      }
      leftScroll.__thesisRevealHandler = revealChapterBlock;
      leftScroll.addEventListener("scroll", revealChapterBlock, { passive: true });
      revealChapterBlock();
    } else {
      chapterBlock.classList.add("is-visible");
    }

    block.append(header, introMedia, subtitle, chapterBlock, referencePanel);
    host.replaceChildren(block);
    host.hidden = false;
  }

  window.renderThesisProjectText = renderThesisProjectText;
})();
