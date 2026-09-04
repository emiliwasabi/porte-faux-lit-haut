(() => {
  function slugify(value) {
    return String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
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
    if (!value) return '';
    if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('./') || value.startsWith('/')) return value;
    if (value.startsWith('../')) return `./assets/projects/${value.replace(/^\.\.\//, '')}`;
    if (value.startsWith('thesisimages/')) return `./assets/projects/${value}`;
    if (value.includes('/')) return `./${value.replace(/^\/+/, '')}`;
    return `./assets/projects/thesisimages/${value}`;
  }

  function renderReferencePanel(referencePanel, project) {
    referencePanel.innerHTML = '';
    const image = document.createElement('img');
    image.className = 'project-text__reference-panel-image';
    image.alt = 'Reference';
    referencePanel.append(image);

    const legend = document.createElement('p');
    legend.className = 'project-text__reference-panel-legend';
    referencePanel.append(legend);

    referencePanel.dataset.project = project?.slug || '';
    return { image, legend };
  }

  function renderMediaReference(reference, project, container) {
    const value = String(reference).trim();
    if (!value) return;

    const mediaPath = resolveMediaPath(value, project);
    const figure = document.createElement('figure');
    figure.className = 'project-text__figure';

    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaPath);
    const isPdf = /\.pdf$/i.test(mediaPath);

    if (isPdf) {
      const embed = document.createElement('object');
      embed.className = 'project-text__media project-text__media--pdf';
      embed.type = 'application/pdf';
      embed.data = mediaPath;
      embed.title = project.title;
      figure.append(embed);
      container.append(figure);
      return;
    }

    const media = isVideo ? document.createElement('video') : document.createElement('img');
    media.className = 'project-text__media';
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
    const para = document.createElement('p');
    para.className = 'project-text__paragraph';
    const content = String(text).replace(/\s+/g, ' ').trim();
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
      const image = referencePanel.querySelector('.project-text__reference-panel-image');
      const legend = referencePanel.querySelector('.project-text__reference-panel-legend');
      if (image) {
        image.src = media;
        image.alt = legendValue;
      }
      if (legend) legend.textContent = legendValue;
      activeReference = reference;
      referencePanel.hidden = false;
      requestAnimationFrame(() => referencePanel.classList.add('is-visible'));
    };

    const hideReference = (reference) => {
      if (activeReference !== reference || pinnedReference === reference) return;
      referencePanel.classList.remove('is-visible');
      setTimeout(() => {
        if (activeReference === reference && pinnedReference !== reference && !referencePanel.matches(':hover')) {
          activeReference = null;
          referencePanel.hidden = true;
        }
      }, 120);
    };

    const toggleReference = (reference, imageValue, legendValue) => {
      if (pinnedReference === reference) {
        pinnedReference = null;
        activeReference = null;
        referencePanel.classList.remove('is-visible');
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
      const reference = document.createElement('span');
      reference.className = 'project-text__reference';
      reference.textContent = label;
      reference.tabIndex = 0;
      reference.addEventListener('mouseenter', () => showReference(reference, imageValue, legendValue));
      reference.addEventListener('focus', () => showReference(reference, imageValue, legendValue));
      reference.addEventListener('mouseleave', () => hideReference(reference));
      reference.addEventListener('blur', () => hideReference(reference));
      reference.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleReference(reference, imageValue, legendValue);
      });
      fragment.append(reference);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) fragment.append(document.createTextNode(content.slice(lastIndex)));
    para.append(fragment);
    container.append(para);
  }

  async function renderProjectText(project, host) {
    if (!host || !project?.textFile) return;

    const fileUrl = `./${project.folder}/${project.textFile}`;
    let text = project.description || '';

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      text = await response.text();
    } catch (error) {
      console.error('project-text', error);
    }

    const block = document.createElement('article');
    block.className = 'project-text';
    const lines = (text || '').replace(/\r/g, '').split(/\n/).map((line) => line.trim()).filter((line) => line.length > 0);
    if (!lines.length) {
      host.replaceChildren(block);
      host.hidden = false;
      return;
    }

    const title = document.createElement('h2');
    title.className = 'project-text__title';
    title.textContent = lines[0] || project.title;

    const subtitle = document.createElement('p');
    subtitle.className = 'project-text__subtitle';
    subtitle.textContent = lines[1] || project.description || '';

    const intro = document.createElement('nav');
    intro.className = 'project-text__index';
    const chapterPattern = /^([IVXLC]+)(?:\.\s*|\s+)(.+)$/;
    const bodyLines = lines.slice(2);
    const chapterMatches = [];

    bodyLines.forEach((line) => {
      const match = line.match(chapterPattern);
      if (match) chapterMatches.push({ id: slugify(match[2].trim()), label: formatChapterLabel(line) });
    });

    if (chapterMatches.length) {
      const list = document.createElement('ol');
      list.className = 'project-text__index-list';
      chapterMatches.forEach((chapter) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${chapter.id}`;
        link.className = 'project-text__index-link';
        link.textContent = chapter.label;
        item.append(link);
        list.append(item);
      });
      intro.append(list);
    }

    const body = document.createElement('div');
    body.className = 'project-text__body';
    const planIndex = bodyLines.findIndex((line) => /^\(plan:\)$|^plan:?$/i.test(line));
    const trimmedBodyLines = planIndex >= 0 ? bodyLines.slice(0, planIndex) : bodyLines;
    const firstChapterIndex = trimmedBodyLines.findIndex((line) => /^([IVXLC]+)\.?\s+/.test(line));
    const introLines = firstChapterIndex >= 0 ? trimmedBodyLines.slice(0, firstChapterIndex) : trimmedBodyLines;
    const chapterLines = firstChapterIndex >= 0 ? trimmedBodyLines.slice(firstChapterIndex) : [];

    const renderMetaLineGroup = (items, container) => {
      const meta = document.createElement('p');
      meta.className = 'project-text__meta';
      meta.textContent = items[0] || '';
      container.append(meta);
      const rest = items.slice(1).join(' ');
      if (rest) {
        const para = document.createElement('p');
        para.className = 'project-text__paragraph';
        para.textContent = rest.replace(/\s+/g, ' ').trim();
        container.append(para);
      }
    };

    const renderParagraphGroup = (items, container) => {
      const para = document.createElement('p');
      para.className = 'project-text__paragraph';
      para.textContent = items.join(' ').replace(/\s+/g, ' ').trim();
      container.append(para);
    };

    const renderChapterLineGroup = (items, container) => {
      const firstLine = items[0] || '';
      const match = firstLine.match(/^([IVXLC]+)\.?\s*(.+)$/);
      if (!match) {
        renderParagraphGroup(items, container);
        return;
      }
      const heading = document.createElement('h3');
      heading.className = 'project-text__chapter';
      heading.id = slugify(match[2].trim());
      heading.textContent = formatChapterLabel(firstLine);
      container.append(heading);
      const rest = items.slice(1).join(' ');
      if (rest) {
        const para = document.createElement('p');
        para.className = 'project-text__paragraph';
        para.textContent = rest.replace(/\s+/g, ' ').trim();
        container.append(para);
      }
    };

    let i = 0;
    while (i < introLines.length) {
      const line = introLines[i];
      if (!line) { i += 1; continue; }
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

    let chapterIndex = 0;
    while (chapterIndex < chapterLines.length) {
      const line = chapterLines[chapterIndex];
      if (!line) { chapterIndex += 1; continue; }
      const group = [line];
      chapterIndex += 1;
      while (chapterIndex < chapterLines.length && !/^([IVXLC]+)\.?\s+/.test(chapterLines[chapterIndex])) {
        group.push(chapterLines[chapterIndex]);
        chapterIndex += 1;
      }
      renderChapterLineGroup(group, body);
    }

    title.textContent = lines[0] || project.title;
    subtitle.textContent = lines[1] || project.description || ' ';
    block.append(title, subtitle, body, intro);
    host.replaceChildren(block);
    host.hidden = false;
  }

  window.slugify = slugify;
  window.formatChapterLabel = formatChapterLabel;
  window.renderProjectText = renderProjectText;
})();
