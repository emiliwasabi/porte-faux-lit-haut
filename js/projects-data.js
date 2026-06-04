(() => {
  let cache = null;
  let loadPromise = null;

  window.getProjectsData = async function getProjectsData() {
    if (cache) return cache;
    if (!loadPromise) {
      loadPromise = fetch("./data/projects.json")
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => {
          cache = data;
          document.dispatchEvent(
            new CustomEvent("projectsready", { detail: data }),
          );
          return data;
        })
        .catch((error) => {
          loadPromise = null;
          throw error;
        });
    }
    return loadPromise;
  };
})();
