(() => {
  const GUTTER_TOP = 4;
  const GUTTER_CONTACTS_H = 160;
  const GUTTER_STEP = 72;
  const INDEX_GUTTER_MAX = 16;

  function initProjectGallery() {
    const bookGutter = document.querySelector('.book-gutter');
    const galleryHost = document.querySelector('.project-gallery-host');
    const leftScroll = document.querySelector('.layer-scroll--left');
    const indexScroll = document.querySelector('.layer-scroll--index');
    const projectDescription = document.querySelector('.project-description');
    const lightbox = document.querySelector('.media-lightbox');
    const lightboxStage = lightbox?.querySelector('.media-lightbox__stage');
    const lightboxPrevious = lightbox?.querySelector('.media-lightbox__previous');
    const lightboxNext = lightbox?.querySelector('.media-lightbox__next');
    const mobileReturn = document.querySelector('.mobile-return');
    const mobileExperience = document.querySelector('.mobile-experience');
    const mobileProjectsHost = document.querySelector('.mobile-projects');

    let projects = [];
    let activeSlug = null;
    let galleryObserver = null;
    let lightboxIndex = 0;
    const mobileMediaQuery = window.matchMedia('(max-width: 700px)');

    function bySlug(slug) {
      return projects.find((p) => p.slug === slug);
    }

    function getMobileProjectMeta(project) {
      if (!project) return { title: '', description: '' };
      if (project.slug === 'thesis-draft') {
        return {
          title: 'webbed gardens',
          description: 'please see this written work on a desktop',
        };
      }
      return {
        title: project.title || '',
        description: project.description || '',
      };
    }

    function renderMobileProjects() {
      if (!mobileExperience || !mobileProjectsHost || mobileMediaQuery.matches === false) {
        mobileExperience.hidden = true;
        mobileProjectsHost.replaceChildren();
        return;
      }

      const visibleProjects = projects
        .filter((project) => project.active !== false)
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

      const cards = [];

      visibleProjects.forEach((project) => {
        const card = document.createElement('article');
        card.className = 'mobile-project-card mobile-project-card--project';
        const gallery = document.createElement('div');
        gallery.className = 'mobile-project-gallery';

        const slides = project.images?.length ? project.images : [null];
        slides.forEach((filename, imageIndex) => {
          const slide = document.createElement('figure');
          slide.className = 'mobile-project-slide';

          let media = null;
          if (filename) {
            const isVideo = window.isVideoMedia(filename);
            media = isVideo ? document.createElement('video') : document.createElement('img');
            media.className = 'mobile-project-media';
            media.alt = `${project.title} ${imageIndex + 1}`;

            if (isVideo) {
              media.muted = true;
              media.loop = true;
              media.autoplay = true;
              media.playsInline = true;
              media.src = window.projectImageSrc(project, filename);
            } else {
              media.src = window.projectImageSrc(project, filename);
            }
          } else {
            media = document.createElement('div');
            media.className = 'mobile-project-empty';
            media.textContent = project.title;
          }

          const meta = getMobileProjectMeta(project);
          const caption = document.createElement('figcaption');
          caption.className = 'mobile-project-caption';
          caption.innerHTML = `
            <span class="mobile-project-caption__title">${meta.title}</span>
            <span class="mobile-project-caption__description">${meta.description}</span>
          `;

          slide.append(media, caption);

          let startX = 0;
          let startY = 0;
          slide.addEventListener('pointerdown', (event) => {
            startX = event.clientX;
            startY = event.clientY;
          });
          slide.addEventListener('pointerup', (event) => {
            const dx = Math.abs(event.clientX - startX);
            const dy = Math.abs(event.clientY - startY);
            if (dx > 10 || dy > 10) return;
            card.classList.toggle('is-paused');
            if (media instanceof HTMLVideoElement) {
              if (card.classList.contains('is-paused')) {
                media.pause();
              } else {
                media.play().catch(() => {});
              }
            }
          });

          gallery.append(slide);
        });

        card.append(gallery);
        cards.push(card);
      });

      mobileProjectsHost.replaceChildren(...cards);
      mobileExperience.hidden = false;
    }

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
      const url = window.projectImageSrc(project, filename);
      const media = window.isVideoMedia(filename) ? document.createElement('video') : document.createElement('img');
      media.className = 'media-lightbox__media';
      if (direction > 0) media.classList.add('media-lightbox__media--from-right');
      if (direction < 0) media.classList.add('media-lightbox__media--from-left');
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
      return { top: items.slice(0, GUTTER_TOP), bottom: items.slice(GUTTER_TOP) };
    }

    function gutterPartitionOne(project) {
      const files = project.images || [];
      const items = files.map((filename, imageIndex) => ({ project, filename, imageIndex }));
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
      const min = Math.ceil(Math.max(window.innerHeight - GUTTER_CONTACTS_H, GUTTER_STEP * GUTTER_TOP) / GUTTER_STEP);
      const filled = repeatToFill(flat, min);
      return { top: filled.slice(0, GUTTER_TOP), bottom: filled.slice(GUTTER_TOP) };
    }

    function appendMedia(fig, project, filename, className, { eager, high, sizes }) {
      const url = window.projectImageSrc(project, filename);
      if (window.isVideoMedia(filename)) {
        const video = document.createElement('video');
        video.className = className;
        video.setAttribute('aria-hidden', 'true');
        window.assignProjectMedia(video, url, { eager, high });
        fig.append(video);
        return;
      }
      const img = document.createElement('img');
      img.className = className;
      img.alt = '';
      window.assignProjectMedia(img, url, { eager, high, sizes });
      fig.append(img);
    }

    function gutterFigure(item, eager) {
      const fig = document.createElement('figure');
      fig.className = 'gutter-item';
      fig.dataset.imageIndex = String(item.imageIndex);
      fig.dataset.slug = item.project.slug;
      appendMedia(fig, item.project, item.filename, 'gutter-img', {
        eager,
        sizes: 'var(--gutter-width)',
      });
      return fig;
    }

    function renderGutterGroup(host, items, eagerCount = 0) {
      host.replaceChildren();
      items.forEach((item, i) => host.append(gutterFigure(item, i < eagerCount)));
    }

    function setGutterHighlight(index) {
      document.querySelectorAll('.gutter-item').forEach((el) => {
        el.classList.toggle('is-active', index >= 0 && Number(el.dataset.imageIndex) === index);
      });
    }

    function scrollToGalleryImage(index) {
      if (!galleryHost || !activeSlug || !Number.isFinite(index)) return;
      const target = galleryHost.querySelector(`.project-gallery__item[data-image-index="${index}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setGutterHighlight(index);
    }

    function renderGutter(slug = activeSlug) {
      const top = document.querySelector('.gutter-media--top');
      const bottom = document.querySelector('.gutter-media--bottom');
      if (!top || !bottom || !projects.length) return;

      activeSlug = slug;
      const isThesis = slug === 'thesis-draft';
      const partition = isThesis ? gutterPartitionIndex() : slug ? gutterPartitionOne(bySlug(slug)) : gutterPartitionIndex();
      const part = fillGutter(partition, true);
      const eager = slug && !isThesis ? 2 : 1;
      renderGutterGroup(top, part.top, eager);
      renderGutterGroup(bottom, part.bottom, Math.max(0, eager - part.top.length));
      bookGutter?.classList.toggle('is-project-sync', Boolean(slug) && !isThesis);
      bookGutter?.classList.toggle('is-index-mix', !slug || isThesis);
      setGutterHighlight(slug && !isThesis ? 0 : -1);
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
        if (project.textFile && project.slug === 'thesis-draft') {
          window.renderThesisProjectText?.(project, galleryHost).catch((error) => console.error('project-text', error));
        } else if (project.textFile) {
          window.renderProjectText?.(project, galleryHost).catch((error) => console.error('project-text', error));
        }
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'project-gallery';
      project.images.forEach((filename, i) => {
        const fig = document.createElement('figure');
        fig.className = 'project-gallery__item';
        fig.dataset.imageIndex = String(i);
        appendMedia(fig, project, filename, 'project-gallery__media', {
          eager: i === 0,
          high: i === 0,
          sizes: '(max-width: 900px) 100vw, 50vw',
        });
        wrap.append(fig);
      });
      galleryHost.replaceChildren(wrap);
      galleryHost.hidden = false;
      window.preloadProjectImages(project, 2);
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
              new CustomEvent('galleryimageactive', {
                detail: { index: Number(best.dataset.imageIndex) },
              }),
            );
          }
        },
        {
          root: leftScroll,
          threshold: [0, 0.35, 0.5, 0.65, 0.8, 1],
          rootMargin: '-8% 0px -8% 0px',
        },
      );
      galleryHost.querySelectorAll('.project-gallery__item').forEach((el) => galleryObserver.observe(el));
      document.dispatchEvent(new CustomEvent('galleryimageactive', { detail: { index: 0 } }));
    }

    function syncProjectState() {
      if (activeSlug && document.body.dataset.page === '2') {
        document.body.setAttribute('data-project', activeSlug);
      } else {
        document.body.removeAttribute('data-project');
      }
      if (mobileReturn) {
        mobileReturn.hidden = !(activeSlug && document.body.dataset.page === '2');
      }
    }

    function onProjectVisit(slug) {
      const project = bySlug(slug);
      if (project) window.preloadProjectImages(project, 2);
      if (projectDescription) {
        const shouldHide = project?.slug === 'thesis-draft';
        projectDescription.textContent = shouldHide ? '' : project?.description || '';
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
        projectDescription.textContent = '';
        projectDescription.hidden = true;
      }
      renderGallery(null);
      renderGutter(null);
      indexScroll?.scrollTo({ top: 0, behavior: 'smooth' });
      leftScroll && (leftScroll.scrollTop = 0);
      history.replaceState(null, '', `${location.pathname}${location.search}`);
      syncProjectState();
    }

    galleryHost?.addEventListener('click', (event) => {
      const media = event.target.closest('.project-gallery__media');
      if (!media || !activeSlug) return;
      event.preventDefault();
      event.stopPropagation();
      showLightboxMedia(Number(media.closest('.project-gallery__item')?.dataset.imageIndex));
    });

    lightbox?.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightboxStage?.addEventListener('click', (event) => event.stopPropagation());
    lightboxPrevious?.addEventListener('click', () => showLightboxMedia(lightboxIndex - 1, -1));
    lightboxNext?.addEventListener('click', () => showLightboxMedia(lightboxIndex + 1, 1));
    document.addEventListener('keydown', (event) => {
      if (lightbox?.hidden) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showLightboxMedia(lightboxIndex - 1, -1);
      if (event.key === 'ArrowRight') showLightboxMedia(lightboxIndex + 1, 1);
    });

    document.addEventListener('projectvisit', (e) => {
      if (e.detail?.project?.slug) onProjectVisit(e.detail.project.slug);
    });
    document.addEventListener('galleryimageactive', (e) => {
      if (activeSlug && Number.isFinite(e.detail?.index)) setGutterHighlight(e.detail.index);
    });
    document.addEventListener('indexreset', resetIndex);
    mobileReturn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.dispatchEvent(new CustomEvent('indexreset'));
    });
    bookGutter?.addEventListener('click', (e) => {
      if (document.body.dataset.page !== '2') return;
      const item = e.target.closest('.gutter-item');
      if (!item?.dataset.slug) return;

      e.preventDefault();
      e.stopPropagation();

      if (activeSlug) {
        scrollToGalleryImage(Number(item.dataset.imageIndex));
        return;
      }

      const project = bySlug(item.dataset.slug);
      if (!project) return;
      history.pushState(null, '', `#${project.slug}`);
      window.recordProjectVisit?.(project);
    });
    document.addEventListener('pagechange', (e) => {
      const p = e.detail?.page;
      if (p !== 2) renderGallery(null);
      if (p === 3) {
        activeSlug = null;
        renderGutter(null);
      } else if (p === 2 && !activeSlug) renderGutter(null);
      syncProjectState();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderGutter(activeSlug), 150);
    });

    window.getProjectsData()
      .then((data) => {
        projects = (data.projects || []).sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
        renderGutter(null);
        renderMobileProjects();
        syncProjectState();
      })
      .catch((err) => console.error('project-media', err));
  }

  window.initProjectGallery = initProjectGallery;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.initProjectGallery?.();
    });
  } else {
    window.initProjectGallery?.();
  }
})();
