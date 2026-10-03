(function () {
  "use strict";
  const script = document.currentScript;
  const dataUrl = new URL("navigation.json", script.src);
  const repository = window.CATEDRA51_ADMIN_CONFIG?.repository || "lucasmarquezz/CATEDRA51";
  const projectName = repository.split("/")[1];
  const basePath = location.hostname.endsWith(".github.io") && location.pathname.toLowerCase().startsWith("/" + projectName.toLowerCase() + "/")
    ? "/" + projectName + "/"
    : "/";

  fetch(dataUrl, { cache: "no-cache" })
    .then(response => {
      if (!response.ok) throw new Error("No se pudo cargar el menú.");
      return response.json();
    })
    .then(data => {
      const nav = document.querySelector("#sidebar nav");
      const bottom = document.querySelector(".sidebar-bottom");
      if (nav && typeof data.nav === "string") {
        nav.innerHTML = data.nav;
        normalizeLinks(nav, basePath);
      }
      if (bottom && typeof data.bottom === "string") {
        bottom.innerHTML = data.bottom;
        normalizeLinks(bottom, basePath);
      }
    })
    .catch(error => console.warn("CATEDRA51: se conserva el menú de esta página.", error));

  function normalizeLinks(container, base) {
    container.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || /^(?:https?:|mailto:|tel:)/i.test(href)) return;
      link.setAttribute("href", base + href.replace(/^\/+/, ""));
    });
  }
})();