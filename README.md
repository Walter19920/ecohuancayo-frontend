# EcoHuancayo S.A.C. — Frontend



Aplicación web de interfaz para la operación diaria de EcoHuancayo en Huancayo: gestión de clientes, rutas, flota, residuos, seguimiento de recojos y consumo de servicios del backend.



---



## Estructura del proyecto



```text

Frontend/

├── .github/                  # Workflows de automatización e integración continua (GitHub Actions)

├── dist/                     # Carpeta generada tras compilar el proyecto para producción

├── node_modules/             # Dependencias de Node.js instaladas localmente

├── public/                   # Archivos públicos estáticos servidos directamente

├── src/

│   ├── api/                  # Configuración del cliente HTTP y llamadas a los endpoints del backend

│   ├── assets/               # Recursos visuales como imágenes e íconos

│   ├── components/           # Componentes reutilizables de la interfaz

│   ├── context/              # Manejo de estado global de la aplicación

│   ├── hooks/                # Hooks personalizados y reutilizables

│   ├── pages/                # Pantallas o vistas principales del sistema

│   ├── services/             # Lógica de consumo de servicios y transformación/uso de datos

│   ├── utils/                # Funciones y utilidades auxiliares

│   ├── App.jsx               # Componente raíz y definición de rutas/estructura principal

│   ├── index.css             # Estilos globales y configuración de Tailwind CSS

│   └── main.jsx              # Punto de entrada que monta la aplicación en el DOM

├── .env                      # Variables de entorno locales

├── .env.example              # Plantilla de variables de entorno requeridas

├── .gitattributes            # Reglas de atributos de Git para el repositorio

├── .gitignore                # Archivos y carpetas ignorados por Git

├── .npmrc                    # Configuración local/de proyecto para npm

├── AGENTS.md                 # Lineamientos y convenciones de trabajo para agentes/desarrollo

├── eslint.config.js          # Configuración del linter ESLint para calidad de código

├── index.html                # Plantilla HTML base donde se monta la aplicación

├── package-lock.json         # Bloqueo exacto de versiones de dependencias npm

├── package.json              # Scripts, dependencias y metadatos del proyecto (React, Tailwind CSS y Vite)

├── PRD.md                    # Documento de requisitos y especificaciones del frontend

├── README.md                 # Documentación general del repositorio frontend

└── vite.config.js            # Configuración de Vite para desarrollo y compilación

```



---



## Instalación y trabajo en local



1. Clonar el repositorio:

   git clone https://github.com/Walter19920/ecohuancayo-frontend.git

   cd ecohuancayo-frontend



2. Crear el archivo .env a partir de .env.example y configurar la URL del backend local.



3. Instalar dependencias:

   npm install



4. Ejecutar el servidor de desarrollo o la compilación local según tus scripts de package.json (y revisiones con ESLint cuando corresponda).



---



## Despliegue y CI/CD



- Sitio estático global (Red Global): El proyecto (construido con React, Tailwind CSS y Vite) se compila como archivos estáticos listos para entregar en vez de subirse como web service. La ventaja de trabajar así es que no requiere un servidor procesando cada vista en tiempo real, sino que se distribuye directamente al navegador desde una red global, logrando carga más rápida, menor costo y menor mantenimiento.

- GitHub Actions: Valida automáticamente los cambios en el repositorio mediante flujos de CI/CD (revisiones de código y comprobaciones) para prevenir errores o regresiones antes de pasar a producción.


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
