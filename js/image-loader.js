(() => {
  const PLACEHOLDER =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  const warmedUrls = new Set();
  const warmQueue = new Map();

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

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        const url = img.dataset.src;
        if (!url) {
          observer.unobserve(img);
          continue;
        }

        warmUrl(url)
          .then(() => {
            img.src = url;
            img.removeAttribute("data-src");
          })
          .catch(() => {
            img.removeAttribute("data-src");
          });

        observer.unobserve(img);
      }
    },
    { rootMargin: "280px 0px", threshold: 0.01 },
  );

  window.assignImageSrc = function assignImageSrc(img, url, options = {}) {
    if (!(img instanceof HTMLImageElement) || !url) return;

    img.decoding = "async";
    if (options.sizes) img.sizes = options.sizes;

    if (options.eager) {
      img.loading = "eager";
      img.fetchPriority = options.high ? "high" : "auto";
      img.removeAttribute("data-src");
      img.src = url;
      warmUrl(url);
      return;
    }

    img.loading = "lazy";
    img.fetchPriority = "low";
    img.dataset.src = url;
    if (!img.getAttribute("src")) img.src = PLACEHOLDER;
    observer.observe(img);
  };

  window.preloadProjectImages = function preloadProjectImages(project, limit = 2) {
    if (!project?.images?.length) return;

    const folder = project.folder || `assets/projects/${project.slug}`;
    project.images.slice(0, limit).forEach((filename) => {
      warmUrl(`./${folder}/${filename}`);
    });
  };
})();
