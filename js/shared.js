(() => {
  const PLACEHOLDER =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  let projectsCache = null;
  let projectsPromise = null;
  const warmedUrls = new Set();
  const warmQueue = new Map();

  const lazyObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const url = el.dataset.src;
        if (!url) {
          lazyObserver.unobserve(el);
          continue;
        }
        warmUrl(url)
          .then(() => {
            el.src = url;
            el.removeAttribute("data-src");
            if (el instanceof HTMLVideoElement) {
              el.load();
              el.play().catch(() => {});
            }
          })
          .catch(() => el.removeAttribute("data-src"));
        lazyObserver.unobserve(el);
      }
    },
    { rootMargin: "280px 0px", threshold: 0.01 },
  );

  function warmUrl(url) {
    if (warmedUrls.has(url)) return Promise.resolve(url);
    if (warmQueue.has(url)) return warmQueue.get(url);

    const isVideo = /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
    const promise = new Promise((resolve, reject) => {
      if (isVideo) {
        const probe = document.createElement("video");
        probe.preload = "metadata";
        probe.onloadeddata = () => {
          warmedUrls.add(url);
          warmQueue.delete(url);
          resolve(url);
        };
        probe.onerror = () => {
          warmQueue.delete(url);
          reject(new Error(`Failed to load ${url}`));
        };
        probe.src = url;
        return;
      }
      const probe = new Image();
      probe.decoding = "async";
      probe.onload = () => {
        warmedUrls.add(url);
        warmQueue.delete(url);
        resolve(url);
      };
      probe.onerror = () => {
        warmQueue.delete(url);
        reject(new Error(`Failed to load ${url}`));
      };
      probe.src = url;
    });

    warmQueue.set(url, promise);
    return promise;
  }

  window.isVideoMedia = (filename) => /\.(mp4|webm|mov)$/i.test(filename);

  window.getProjectsData = async () => {
    if (projectsCache) return projectsCache;
    if (!projectsPromise) {
      projectsPromise = fetch("./data/projects.json")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => {
          projectsCache = data;
          return data;
        })
        .catch((err) => {
          projectsPromise = null;
          throw err;
        });
    }
    return projectsPromise;
  };

  window.projectImageSrc = (project, filename) => {
    const folder = project.folder || `assets/projects/${project.slug}`;
    return `./${folder}/${filename}`;
  };

  window.assignProjectMedia = (el, url, { eager = false, high = false, sizes } = {}) => {
    if (!url) return;

    if (el instanceof HTMLVideoElement) {
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
      if (eager) {
        el.preload = "auto";
        el.src = url;
        warmUrl(url).then(() => el.play().catch(() => {}));
      } else {
        el.preload = "none";
        el.dataset.src = url;
        lazyObserver.observe(el);
      }
      return;
    }

    if (!(el instanceof HTMLImageElement)) return;

    el.decoding = "async";
    if (sizes) el.sizes = sizes;

    if (eager) {
      el.loading = "eager";
      el.fetchPriority = high ? "high" : "auto";
      el.src = url;
      warmUrl(url);
      return;
    }

    el.loading = "lazy";
    el.fetchPriority = "low";
    el.dataset.src = url;
    if (!el.getAttribute("src")) el.src = PLACEHOLDER;
    lazyObserver.observe(el);
  };

  window.assignImageSrc = (img, url, opts) => window.assignProjectMedia(img, url, opts);

  window.preloadProjectImages = (project, limit = 2) => {
    if (!project?.images?.length) return;
    project.images
      .slice(0, limit)
      .forEach((file) => warmUrl(window.projectImageSrc(project, file)));
  };
})();
