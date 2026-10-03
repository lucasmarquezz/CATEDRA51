const COOKIE_NAME = "c51_oauth_state";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response("CATEDRA51 admin authorization is running.", {
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }
    if (url.pathname === "/auth/start" && request.method === "GET") {
      return startLogin(url, env);
    }
    if (url.pathname === "/auth/callback" && request.method === "GET") {
      return finishLogin(request, url, env);
    }
    return new Response("Not found", { status: 404 });
  }
};

function startLogin(url, env) {
  const siteOrigin = env.ALLOWED_SITE_ORIGIN;
  if (!siteOrigin || url.searchParams.get("origin") !== siteOrigin) {
    return new Response("Origen de CATEDRA51 no autorizado.", { status: 403 });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.ALLOWED_GITHUB_LOGIN) {
    return new Response("Falta configurar la aplicación de GitHub en el Worker.", { status: 503 });
  }

  const state = randomHex(32);
  const callback = new URL("/auth/callback", url.origin);
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", callback.href);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");
  authorize.searchParams.set("scope", "repo");

  return new Response(null, {
    status: 302,
    headers: {
      "Location": authorize.href,
      "Set-Cookie": stateCookie(state),
      "Cache-Control": "no-store"
    }
  });
}

async function finishLogin(request, url, env) {
  const params = url.searchParams;
  const stateCookieValue = readCookie(request.headers.get("Cookie") || "", COOKIE_NAME);
  const state = params.get("state");
  const siteOrigin = env.ALLOWED_SITE_ORIGIN;

  if (!siteOrigin || !state || state !== stateCookieValue || params.has("error")) {
    return callbackPage(siteOrigin || "https://lucasmarquezz.github.io", {
      error: params.get("error_description") || params.get("error") || "No se pudo validar el inicio de sesión."
    }, stateCookie(""));
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "CATEDRA51-admin"
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: params.get("code"),
      redirect_uri: new URL("/auth/callback", url.origin).href
    })
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    return callbackPage(siteOrigin, { error: "GitHub no pudo completar el acceso al panel." }, stateCookie(""));
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${tokenData.access_token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "CATEDRA51-admin"
    }
  });
  const user = await userResponse.json();
  if (!userResponse.ok || user.login !== env.ALLOWED_GITHUB_LOGIN) {
    return callbackPage(siteOrigin, { error: "Esta cuenta de GitHub no tiene acceso al panel." }, stateCookie(""));
  }

  return callbackPage(siteOrigin, {
    token: tokenData.access_token,
    login: user.login
  }, stateCookie(""));
}

function callbackPage(targetOrigin, result, clearCookie) {
  const payload = JSON.stringify(result).replace(/</g, "\\u003c");
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Acceso a CATEDRA51</title>
<body><p>Volviendo a CATEDRA51…</p><script>
const result = ${payload};
if (window.opener) {
  window.opener.postMessage({ type: "c51-admin-auth", ...result }, ${JSON.stringify(targetOrigin)});
  window.close();
} else {
  document.body.textContent = result.error || "Cierra esta ventana y vuelve a CATEDRA51.";
}
</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
      "set-cookie": clearCookie
    }
  });
}

function randomHex(length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function stateCookie(value) {
  return `${COOKIE_NAME}=${value}; Path=/auth/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=${value ? 600 : 0}`;
}

function readCookie(cookieHeader, name) {
  const prefix = `${name}=`;
  const entry = cookieHeader.split(";").map(part => part.trim()).find(part => part.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : "";
}
