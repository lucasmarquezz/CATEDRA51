# Configuración del panel ADMINISTRADORES

El botón permite editar visualmente el contenido de la página abierta. Los cambios se guardan como commits en `main`; GitHub Pages vuelve a publicar el sitio automáticamente. El token de GitHub vive solo en memoria durante la sesión y se pierde al recargar.

GitHub Pages es estático y no puede custodiar el secreto de una aplicación OAuth. Por eso el inicio de sesión usa un Worker pequeño de Cloudflare como intermediario. El Worker valida el usuario de GitHub y guarda el secreto de la aplicación fuera del código público.

## 1. Desplegar el Worker

Necesitás una cuenta de Cloudflare. Desde la carpeta del repositorio:

```powershell
npx wrangler login
npx wrangler deploy --config oauth-worker/wrangler.toml
```

Cloudflare va a mostrar una dirección similar a `https://catedra51-admin-auth.<tu-cuenta>.workers.dev`. Guardala.

Si publicaste CATEDRA51 en un dominio propio, editá `ALLOWED_SITE_ORIGIN` en `oauth-worker/wrangler.toml` para que contenga solamente el origen, por ejemplo `https://catedra51.com`, sin la ruta `/CATEDRA51`.

## 2. Crear la GitHub App

En GitHub, abrí **Settings → Developer settings → GitHub Apps → New GitHub App** y completá:

- Nombre: `CATEDRA51 Admin Editor`.
- Homepage URL: `https://lucasmarquezz.github.io/CATEDRA51/`.
- Callback URL: la URL del Worker seguida de `/auth/callback`.
- Activá la autorización de usuarios (OAuth).
- En **Repository permissions**, asigná **Contents: Read and write**.
- Instalá la App solo en el repositorio `lucasmarquezz/CATEDRA51`.
- No habilites webhooks.

Copiá el Client ID y generá un Client secret. El secreto no se pega en la página ni en este repositorio.

## 3. Guardar las credenciales en Cloudflare

Desde la carpeta del repositorio, ejecutá los dos comandos y pegá los valores cuando Wrangler los solicite:

```powershell
npx wrangler secret put GITHUB_CLIENT_ID --config oauth-worker/wrangler.toml
npx wrangler secret put GITHUB_CLIENT_SECRET --config oauth-worker/wrangler.toml
npx wrangler deploy --config oauth-worker/wrangler.toml
```

El Worker está configurado para permitir solo la cuenta `lucasmarquezz`. Si querés autorizar otra cuenta, actualizá `ALLOWED_GITHUB_LOGIN` en `oauth-worker/wrangler.toml` antes de desplegarlo.

## 4. Conectar el sitio

En `js/admin-config.js`, reemplazá `https://CONFIGURAR-TU-WORKER.workers.dev` por la dirección real del Worker. Publicá ese cambio en `main`.

Abrí CATEDRA51, tocá **ADMINISTRADORES** e iniciá sesión con GitHub. El editor permite modificar el contenido de la página abierta, editar celdas y agregar o quitar filas y columnas. El menú se comparte entre las páginas y también se puede cambiar desde cualquier página. **Guardar cambios** registra los cambios en `main`.

## Alcance

El menú compartido vive en `js/navigation.json` y el editor lo actualiza para todo el sitio. Las páginas `pages/apuntes.html` y `pages/encuestas.html` están vacías en el repositorio actual y por eso no muestran el editor.
