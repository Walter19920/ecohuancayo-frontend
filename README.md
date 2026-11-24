# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information about how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Despliegue en Render (Static Site)

El repositorio tiene su raíz en `Frontend/`. El workflow `.github/workflows/deploy.yml` ejecuta
`npm ci`, `npm run lint` y `npm run build` (con `VITE_API_URL=https://ecohuancayo-backend.onrender.com/api/v1`)
en cada `push` a `main` y, si todo pasa, dispara el deploy hook de Render desde el secreto de
GitHub `HOOK_RENDER_FRONTEND`.

Configuración del Static Site en Render:

- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://ecohuancayo-backend.onrender.com/api/v1`

El límite de memoria del plan gratuito (512 MB) se respeta gracias a `.npmrc`, que aplica
`NODE_OPTIONS=--max-old-space-size=400` a todos los scripts npm (incluido el build de Render).
`public/_redirects` (`/* /index.html 200`) garantiza que React Router funcione con recargas
directas y rutas profundas.
