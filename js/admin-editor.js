(function () {
  "use strict";

  const config = window.CATEDRA51_ADMIN_CONFIG;
  const allowedLogin = "lucasmarquezz";
  let accessToken = null;
  let editing = false;
  let dirty = false;
  let popup = null;
  let originalNavHTML = "";
  let originalBottomHTML = "";

  const widget = document.createElement("div");
  widget.id = "c51-admin-widget";
  widget.innerHTML = '<button type="button" class="c51-admin-open">ADMINISTRADORES</button>';
  document.body.append(widget);

  const style = document.createElement("style");
  style.id = "c51-admin-style";
  style.textContent = `
    #c51-admin-widget{position:fixed;z-index:2147483000;right:18px;bottom:18px;font:600 13px/1.2 system-ui,sans-serif}
    #c51-admin-widget button,.c51-admin-toolbar button{border:1px solid #d7dee8;border-radius:10px;background:#173e63;color:#fff;padding:11px 15px;cursor:pointer;box-shadow:0 8px 24px #10243a30}
    #c51-admin-widget button:hover,.c51-admin-toolbar button:hover{filter:brightness(1.12)}
    .c51-admin-toolbar{position:fixed;z-index:2147483001;top:12px;left:50%;transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;gap:7px;max-width:calc(100vw - 24px);padding:10px;background:#101c29;color:#fff;border-radius:14px;box-shadow:0 10px 35px #0004;font:500 13px/1.2 system-ui,sans-serif}
    .c51-admin-toolbar button{padding:9px 11px;box-shadow:none;white-space:nowrap}
    .c51-admin-toolbar .c51-save{background:#22744b;border-color:#22744b}
    .c51-admin-toolbar .c51-exit{background:#354454}
    .c51-admin-status{align-self:center;min-width:90px;font-size:12px;color:#d6e3ef}
    [data-c51-editing="true"] main,[data-c51-editing="true"] #sidebar nav,[data-c51-editing="true"] .sidebar-bottom,[data-c51-editing="true"] .sidebar-brand{outline:2px dashed #3b82b5;outline-offset:4px}
    [data-c51-editing="true"] main,[data-c51-editing="true"] #sidebar nav,[data-c51-editing="true"] .sidebar-bottom,[data-c51-editing="true"] .sidebar-brand{caret-color:#125b91}
    [data-c51-editing="true"] td,[data-c51-editing="true"] th{outline:1px dashed #6d9ac0}
    @media(max-width:620px){.c51-admin-toolbar{top:auto;bottom:8px;left:8px;right:8px;transform:none;max-width:none}.c51-admin-toolbar button{padding:9px 10px;font-size:12px}.c51-admin-status{min-width:0}}
  `;
  document.head.append(style);

  const openButton = widget.querySelector("button");
  openButton.addEventListener("click", async function () {
    if (editing) {
      if (dirty && !window.confirm("Hay cambios sin guardar. ¿Salir y descartarlos?")) return;
      window.location.reload();
      return;
    }
    if (!accessToken) {
      await signIn();
      return;
    }
    enterEditing();
  });

  async function signIn() {
    if (!config || !config.workerUrl || config.workerUrl.includes("CONFIGURAR-TU-WORKER")) {
      window.alert("El panel está preparado, pero falta desplegar el servicio seguro de acceso. Consultá ADMIN-SETUP.md en el repositorio.");
      return;
    }

    const workerUrl = config.workerUrl.replace(/\/$/, "");
    const loginUrl = new URL(workerUrl + "/auth/start");
    loginUrl.searchParams.set("origin", window.location.origin);
    const callbackUrl = new URL(window.location.href);
    callbackUrl.searchParams.set("c51_auth", "1");
    const channel = new BroadcastChannel("catedra51-admin-auth");
    const cleanup = function () {
      window.clearTimeout(timeout);
      channel.close();
      window.removeEventListener("message", onMessage);
    };
    function handleResult(data) {
      if (data?.type !== "c51-admin-auth") return;
      cleanup();
      if (data.error) {
        window.alert(data.error);
        openButton.disabled = false;
        openButton.textContent = "ADMINISTRADORES";
        return;
      }
      if (data.login !== allowedLogin || !data.token) {
        window.alert("Esta cuenta no está autorizada para editar CATEDRA51.");
        openButton.disabled = false;
        openButton.textContent = "ADMINISTRADORES";
        return;
      }
      accessToken = data.token;
      openButton.textContent = "ABRIR EDITOR";
      openButton.disabled = false;
      enterEditing();
    }
    function onMessage(event) {
      if (event.origin !== workerUrl) return;
      handleResult(event.data);
    }
    const timeout = window.setTimeout(function () {
      cleanup();
      if (!accessToken) {
        openButton.disabled = false;
        openButton.textContent = "ADMINISTRADORES";
      }
    }, 5 * 60 * 1000);
    window.addEventListener("message", onMessage);
    channel.onmessage = function (event) { handleResult(event.data); };
    loginUrl.searchParams.set("return_to", callbackUrl.href);
    openButton.disabled = true;
    openButton.textContent = "ABRIENDO GITHUB…";
    window.location.assign(loginUrl.href);
  }

  function enterEditing() {
    const main = document.querySelector("main");
    if (!main) {
      window.alert("Esta página no tiene un área principal editable.");
      return;
    }
    editing = true;
    dirty = false;
    originalNavHTML = document.querySelector("#sidebar nav")?.innerHTML || "";
    originalBottomHTML = document.querySelector(".sidebar-bottom")?.innerHTML || "";
    document.documentElement.dataset.c51Editing = "true";
    main.setAttribute("contenteditable", "true");
    main.setAttribute("spellcheck", "true");
    document.querySelectorAll("#sidebar nav,.sidebar-bottom,.sidebar-brand").forEach(function (node) {
      node.setAttribute("contenteditable", "true");
      node.setAttribute("spellcheck", "true");
    });

    const toolbar = document.createElement("div");
    toolbar.className = "c51-admin-toolbar";
    toolbar.id = "c51-admin-toolbar";
    toolbar.innerHTML = [
      '<button type="button" data-action="paragraph">+ Texto</button>',
      '<button type="button" data-action="table">+ Tabla</button>',
      '<button type="button" data-action="row">+ Fila</button>',
      '<button type="button" data-action="remove-row">− Fila</button>',
      '<button type="button" data-action="column">+ Columna</button>',
      '<button type="button" data-action="remove-column">− Columna</button>',
      '<button type="button" data-action="link">+ Enlace al menú</button>',
      '<button type="button" data-action="save" class="c51-save">Guardar cambios</button>',
      '<span class="c51-admin-status">Sin cambios</span>',
      '<button type="button" data-action="logout" class="c51-exit">Salir</button>'
    ].join("");
    document.body.append(toolbar);
    toolbar.addEventListener("mousedown", function (event) {
      if (event.target.closest("button")) event.preventDefault();
    });
    toolbar.addEventListener("click", handleToolbarClick);
    document.addEventListener("input", markDirty, true);
    document.addEventListener("click", preventNavigation, true);
    document.addEventListener("dblclick", editLink, true);
    openButton.textContent = "MODO EDICIÓN";
    openButton.title = "Salir del editor y descartar cambios sin guardar";
    updateStatus("Editando");
  }

  function handleToolbarClick(event) {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;
    if (action === "paragraph") addParagraph();
    if (action === "table") addTable();
    if (action === "row") addRow();
    if (action === "remove-row") removeRow();
    if (action === "column") changeColumn(1);
    if (action === "remove-column") changeColumn(-1);
    if (action === "link") addNavigationLink();
    if (action === "save") savePage();
    if (action === "logout") {
      if (dirty && !window.confirm("Hay cambios sin guardar. ¿Salir y descartarlos?")) return;
      accessToken = null;
      window.location.reload();
    }
  }

  function markDirty() {
    if (!editing) return;
    dirty = true;
    updateStatus("Cambios sin guardar");
  }

  function updateStatus(text) {
    const status = document.querySelector(".c51-admin-status");
    if (status) status.textContent = text;
  }

  function preventNavigation(event) {
    if (!editing) return;
    const link = event.target.closest("a");
    if (link) event.preventDefault();
  }

  function editLink(event) {
    if (!editing) return;
    const link = event.target.closest("a");
    if (!link || link.closest("#c51-admin-toolbar")) return;
    const next = window.prompt("Destino del enlace:", link.getAttribute("href") || "");
    if (next === null) return;
    const safe = next.trim();
    if (/^\s*javascript:/i.test(safe)) {
      window.alert("Por seguridad, no se permiten enlaces JavaScript.");
      return;
    }
    link.setAttribute("href", safe);
    markDirty();
  }

  function addParagraph() {
    const main = document.querySelector("main");
    const paragraph = document.createElement("p");
    paragraph.textContent = "Escribí aquí el nuevo texto.";
    const selection = window.getSelection();
    const selected = selection?.anchorNode?.parentElement?.closest("main");
    if (selected === main && selection.anchorNode.parentElement.closest("p,h1,h2,h3,li,td,th")) {
      const current = selection.anchorNode.parentElement.closest("p,h1,h2,h3,li,td,th");
      current.after(paragraph);
    } else {
      main.append(paragraph);
    }
    paragraph.focus?.();
    markDirty();
  }

  function addTable() {
    const main = document.querySelector("main");
    const table = document.createElement("table");
    table.innerHTML = "<thead><tr><th>Columna 1</th><th>Columna 2</th></tr></thead><tbody><tr><td>Dato</td><td>Dato</td></tr><tr><td>Dato</td><td>Dato</td></tr></tbody>";
    main.append(table);
    markDirty();
    table.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function addRow() {
    const cell = window.getSelection()?.anchorNode?.parentElement?.closest("td,th");
    const row = cell?.closest("tr");
    if (!row) {
      window.alert("Hacé clic dentro de una tabla y volvé a tocar “+ Fila”.");
      return;
    }
    const index = Array.from(row.parentElement.rows).indexOf(row) + 1;
    const next = row.parentElement.insertRow(index);
    Array.from(row.cells).forEach(function (item) {
      const cell = document.createElement(item.tagName.toLowerCase() === "th" ? "th" : "td");
      cell.textContent = "Dato";
      next.append(cell);
    });
    markDirty();
  }

  function removeRow() {
    const row = window.getSelection()?.anchorNode?.parentElement?.closest("tr");
    if (!row) {
      window.alert("Hacé clic dentro de la fila que querés borrar.");
      return;
    }
    if (window.confirm("¿Borrar esta fila de la tabla?")) {
      row.remove();
      markDirty();
    }
  }

  function changeColumn(direction) {
    const cell = window.getSelection()?.anchorNode?.parentElement?.closest("td,th");
    const row = cell?.closest("tr");
    const table = row?.closest("table");
    if (!cell || !table) {
      window.alert("Hacé clic dentro de la columna que querés cambiar.");
      return;
    }
    const index = cell.cellIndex + (direction > 0 ? 1 : 0);
    Array.from(table.rows).forEach(function (tableRow) {
      if (direction > 0) {
        const newCell = document.createElement(tableRow.parentElement.tagName === "THEAD" ? "th" : "td");
        newCell.textContent = "Dato";
        tableRow.insertBefore(newCell, tableRow.cells[index] || null);
      } else if (tableRow.cells[index]) {
        tableRow.deleteCell(index);
      }
    });
    markDirty();
  }

  function addNavigationLink() {
    const nav = document.querySelector("#sidebar nav");
    if (!nav) {
      window.alert("Esta página no tiene menú lateral.");
      return;
    }
    const label = window.prompt("Texto del enlace:");
    if (!label) return;
    const href = window.prompt("Ruta desde el inicio del sitio (por ejemplo pages/tema.html) o URL:");
    if (!href) return;
    if (/^\s*javascript:/i.test(href)) {
      window.alert("Por seguridad, no se permiten enlaces JavaScript.");
      return;
    }
    const link = document.createElement("a");
    const destination = href.trim();
    link.href = /^(?:https?:|mailto:|tel:|#|\/)/i.test(destination) ? destination : siteBasePath() + destination.replace(/^\/+/, "");
    link.textContent = label.trim();
    nav.append(link);
    markDirty();
  }

  async function savePage() {
    const path = repositoryPath();
    if (!path.endsWith(".html")) {
      window.alert("Solo se pueden guardar páginas HTML desde este editor.");
      return;
    }
    if (!/^([a-z0-9-]+\/)*[a-z0-9-]+\.html$/i.test(path)) {
      window.alert("La ruta de esta página no es válida para guardar.");
      return;
    }
    const toolbar = document.getElementById("c51-admin-toolbar");
    const status = toolbar.querySelector(".c51-admin-status");
    const label = toolbar.querySelector('[data-action="save"]');
    label.disabled = true;
    updateStatus("Guardando en GitHub…");

    toolbar.remove();
    widget.remove();
    const styleElement = document.getElementById("c51-admin-style");
    const savedTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-c51-editing");
    document.querySelectorAll("[contenteditable],[spellcheck]").forEach(function (node) {
      node.removeAttribute("contenteditable");
      node.removeAttribute("spellcheck");
    });
    styleElement?.remove();

    const html = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
    const bytes = new TextEncoder().encode(html);
    let binary = "";
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    const encoded = btoa(binary);

    style.id = "c51-admin-style";
    document.head.append(style);
    document.documentElement.dataset.c51Editing = "true";
    if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
    document.querySelector("main")?.setAttribute("contenteditable", "true");
    document.querySelectorAll("#sidebar nav,.sidebar-bottom,.sidebar-brand").forEach(node => node.setAttribute("contenteditable", "true"));
    document.body.append(toolbar);
    toolbar.querySelector('[data-action="save"]').disabled = false;
    document.body.append(widget);

    try {
      const commonHeaders = {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + accessToken,
        "X-GitHub-Api-Version": "2022-11-28"
      };
      const navChanged =
        (document.querySelector("#sidebar nav")?.innerHTML || "") !== originalNavHTML ||
        (document.querySelector(".sidebar-bottom")?.innerHTML || "") !== originalBottomHTML;

      if (navChanged) {
        const sharedMenu = JSON.stringify({
          nav: canonicalMenuMarkup("#sidebar nav"),
          bottom: canonicalMenuMarkup(".sidebar-bottom")
        }, null, 2);
        updateStatus("Guardando el menú global…");
        await saveGithubFile("js/navigation.json", encodeBase64(sharedMenu), "Actualizar menú global desde CATEDRA51");
      }

      updateStatus("Guardando la página en GitHub…");
      await saveGithubFile(path, encoded, "Editar contenido de " + path + " desde el panel CATEDRA51");
      dirty = false;
      updateStatus("Guardado. GitHub Pages lo publicará en breve.");
      window.setTimeout(() => window.location.reload(), 1700);
    } catch (error) {
      updateStatus("No se pudo guardar");
      window.alert(error.message || "Ocurrió un error al guardar. Tus cambios siguen en pantalla.");
      if (error.message?.includes("401")) {
        accessToken = null;
        window.location.reload();
      }
    }
  }

  async function saveGithubFile(path, content, message) {
    const apiUrl = "https://api.github.com/repos/" + config.repository + "/contents/" + path.split("/").map(encodeURIComponent).join("/");
    const headers = {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + accessToken,
      "X-GitHub-Api-Version": "2022-11-28"
    };
    const current = await fetch(apiUrl + "?ref=" + encodeURIComponent(config.branch), { headers });
    const file = await current.json();
    if (!current.ok || !file.sha) throw new Error(apiMessage(file, "No pude leer " + path + "."));
    const saved = await fetch(apiUrl, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message, content, sha: file.sha, branch: config.branch })
    });
    const result = await saved.json();
    if (!saved.ok) throw new Error(apiMessage(result, "GitHub no pudo guardar " + path + "."));
  }

  function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  function siteBasePath() {
    const repositoryName = (config?.repository || "lucasmarquezz/CATEDRA51").split("/")[1];
    return location.hostname.endsWith(".github.io") ? "/" + repositoryName + "/" : "/";
  }

  function canonicalMenuMarkup(selector) {
    const source = document.querySelector(selector);
    if (!source) return "";
    const wrapper = document.createElement("div");
    wrapper.innerHTML = source.innerHTML;
    const base = siteBasePath();
    wrapper.querySelectorAll("a[href]").forEach(function (link) {
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || /^(?:https?:|mailto:|tel:)/i.test(href)) return;
      let path = href;
      if (href.startsWith(location.origin)) path = new URL(href).pathname;
      if (path.startsWith(base)) path = path.slice(base.length);
      else path = path.replace(/^\/+/, "");
      const parsed = new URL(href, location.href);
      link.setAttribute("href", path + parsed.search + parsed.hash);
    });
    return wrapper.innerHTML;
  }

  function repositoryPath() {
    let path = decodeURIComponent(window.location.pathname).replace(/^\/+/, "");
    if (path.toLowerCase().startsWith("catedra51/")) path = path.slice("catedra51/".length);
    if (!path || path.endsWith("/")) path += "index.html";
    return path;
  }

  function apiMessage(value, fallback) {
    if (value?.message) return value.message;
    return fallback;
  }
})();