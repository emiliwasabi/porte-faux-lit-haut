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
        const img = entry.target;
        const url = img.dataset.src;
        if (!url) {
          lazyObserver.unobserve(img);
          continue;
        }
        warmUrl(url)
          .then(() => {
            img.src = url;
            img.removeAttribute("data-src");
          })
          .catch(() => img.removeAttribute("data-src"));
        lazyObserver.unobserve(img);
      }
    },
    { rootMargin: "280px 0px", threshold: 0.01 },
  );

  function warmUrl(url) {
    if (warmedUrls.has(url)) return Promise.resolve(url);
    if (warmQueue.has(url)) return warmQueue.get(url);

    const promise = new Promise((resolve, reject) => {
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

  window.assignImageSrc = (img, url, { eager = false, high = false, sizes } = {}) => {
    if (!(img instanceof HTMLImageElement) || !url) return;

    img.decoding = "async";
    if (sizes) img.sizes = sizes;

    if (eager) {
      img.loading = "eager";
      img.fetchPriority = high ? "high" : "auto";
      img.src = url;
      warmUrl(url);
      return;
    }

    img.loading = "lazy";
    img.fetchPriority = "low";
    img.dataset.src = url;
    if (!img.getAttribute("src")) img.src = PLACEHOLDER;
    lazyObserver.observe(img);
  };

  window.preloadProjectImages = (project, limit = 2) => {
    if (!project?.images?.length) return;
    project.images
      .slice(0, limit)
      .forEach((file) => warmUrl(window.projectImageSrc(project, file)));
  };
})();
