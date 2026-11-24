# AGENTS.md — EcoHuancayo S.A.C. Frontend

Reglas técnicas de obligado cumplimiento para construir el frontend de **EcoHuancayo S.A.C.**
(gestión de recojo de residuos) como SPA en **React + Vite + Tailwind CSS v4**, consumiendo la
API FastAPI ya finalizada del proyecto.

Este documento define **cómo se trabaja**. La especificación funcional, el contrato de endpoints
y los criterios de aceptación viven en `Frontend/PRD.md`, que es la fuente de verdad del producto.

---

## 1. Alcance y muro de protección del backend

1. Todo el trabajo se realiza **exclusivamente dentro de `Frontend/`**.
2. **PROHIBIDO** crear, modificar, renombrar o eliminar cualquier archivo de `Backend/`.
   El backend FastAPI está finalizado, probado y conectado; no se toca.
3. **PROHIBIDO** leer, copiar o versionar archivos `.env` de `Backend/`. Las variables del
   backend no son insumo del frontend.
4. **PROHIBIDO** crear o modificar archivos en la raíz del repositorio (`Examen Unidad 04/`).
   El CI del frontend se documenta y versiona en `Frontend/.github/workflows/frontend-ci.yml`.
5. El backend solo se inspecciona en **modo lectura** (`Backend/src/backend/apis`,
   `schemas`, `core/config.py`) para validar el contrato. Cualquier cambio de contrato se
   resuelve adaptando el frontend, nunca el backend.
6. Cualquier referencia a levantar el backend va **SIN `--reload`**:
   `uv run uvicorn backend.main:app`.

---

## 2. Stack obligatorio

Versiones reales declaradas en `Frontend/package.json`:

| Capa | Tecnología | Versión |
|---|---|---|
| UI | React + React DOM | `^19.3.1` |
| Build | Vite + `@vitejs/plugin-react` | `^8.3.6` / `^6.1.2` |
| Estilos | Tailwind CSS v4 + `@tailwindcss/vite` | `^4.3.5` |
| HTTP | Axios | `^1.21.1` |
| Rutas | React Router DOM | `^7.18.6` |
| Iconos | Lucide React | `^1.77.0` |

**No se añaden dependencias nuevas.** Nada de librerías de toasts, modales, formularios,
gráficos, estado global, validación o fechas. Todo se construye con lo listado arriba.
Los gráficos se dibujan con HTML/CSS/SVG nativo y Tailwind.

---

## 3. Flujo unidireccional obligatorio

La arquitectura es idiomática de React y el flujo de datos es **estrictamente unidireccional**:

```text
pages/ -> services/ -> api/axiosClient.js -> FastAPI Backend
```

```text
pages/ -> hooks/useCatalogos.js -> services/catalogoService.js
```

```text
App.jsx -> context/AuthContext.jsx -> components/layout/ProtectedRoute.jsx
        -> components/layout/MainLayout.jsx -> pages/
```

Reglas derivadas:

- `pages/` **nunca** importa `axios`, `api/axiosClient.js` ni `fetch`.
- `services/` es la única capa que conoce rutas HTTP y transforma payloads.
- `api/axiosClient.js` es el único lugar que configura `baseURL`, headers e interceptores.
- Los componentes presentacionales (`components/ui/`, `components/layout/`) reciben datos y
  callbacks por props; no llaman servicios por su cuenta.
- `context/` provee estado transversal (sesión y toasts). No reemplaza a los servicios.
- El estado de servidor se pide en el `page` (o en un hook) y se pasa hacia abajo.

---

## 4. Estructura de carpetas canónica

```text
Frontend/
├── public/
│   └── _redirects                  # /* /index.html 200
├── src/
│   ├── api/
│   │   └── axiosClient.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── usuarioService.js
│   │   ├── clienteService.js
│   │   ├── empleadoService.js
│   │   ├── flotaService.js
│   │   ├── catalogoService.js
│   │   ├── recojoService.js
│   │   ├── dashboardService.js
│   │   └── externoService.js
│   ├── hooks/
│   │   └── useCatalogos.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Topbar.jsx
│   │   └── ui/
│   │       ├── ToastContainer.jsx
│   │       ├── ConfirmModal.jsx
│   │       ├── Modal.jsx
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Select.jsx
│   │       ├── Table.jsx
│   │       ├── Badge.jsx
│   │       ├── EmptyState.jsx
│   │       ├── Spinner.jsx
│   │       └── PageHeader.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── RecojosPage.jsx
│   │   ├── ClientesPage.jsx
│   │   ├── OperacionesPage.jsx
│   │   └── UsuariosPage.jsx
│   ├── utils/
│   │   ├── validaciones.js
│   │   ├── formatos.js
│   │   └── errores.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .github/workflows/frontend-ci.yml
├── index.html
├── package.json
└── vite.config.js
```

Convenciones:

- Componentes y páginas: `PascalCase.jsx`.
- Servicios, hooks y utilidades: `camelCase.js`.
- Una página = una ruta del router.
- Sin carpetas `containers/`, `redux/`, `store/` ni duplicación de servicios.

---

## 5. Capa HTTP

### 5.1 `api/axiosClient.js`

Único punto de configuración de Axios:

- `baseURL: import.meta.env.VITE_API_URL` (incluye `/api/v1`).
- Header `Content-Type: application/json`.
- Interceptor de request: adjunta `Authorization: Bearer <token>` si existe sesión.
- Interceptor de response:
  - `401` → limpia sesión y redirige a `/login` (excepto en `POST /auth/login`, donde el error
    se muestra al usuario).
  - El resto de errores se propagan normalizados.
- Exporta un helper `getApiError(error)` que devuelve, en este orden:
  `error.response?.data?.detail` → `error.message` → `"Ocurrió un error inesperado"`.
  Si `detail` viene como array (validación Pydantic), se concatenan los `msg`.

### 5.2 `services/`

- Un servicio por dominio, con funciones nombradas por intención:
  `listarClientes(busqueda)`, `crearCliente(payload)`, `actualizarCliente(id, payload)`.
- Devuelven `response.data` (nunca el objeto Axios completo).
- No contienen JSX, ni estado, ni toasts, ni navegación.
- No construyen URLs absolutas: usan rutas relativas al `baseURL`.
- Serializan fechas/horas en el formato del contrato (`YYYY-MM-DD`, `HH:MM:SS`).

### 5.3 `hooks/`

- `useCatalogos.js` encapsula `GET /catalogos`: devuelve
  `{ catalogos, cargando, error, recargar }` y memoiza las listas.
- Los hooks no renderizan UI ni muestran toasts; devuelven estado y errores.
- Cualquier hook nuevo sigue el patrón `useAlgo` y vive en `src/hooks/`.

### 5.4 `pages/`

- Orquestan: piden datos, manejan estado local de formularios, validan, llaman servicios,
  disparan toasts y renderizan componentes.
- No importan `axios` ni `fetch`.
- No hardcodean URLs ni tokens.

---

## 6. Prohibiciones absolutas

1. `fetch(...)` en cualquier archivo del frontend.
2. `axios` importado fuera de `src/api/axiosClient.js` y `src/services/`.
3. URLs de API escritas a mano (`http://localhost:8000`, dominios de Render, etc.).
   Solo `import.meta.env.VITE_API_URL`.
4. `window.alert`, `window.confirm`, `window.prompt` y cualquier diálogo nativo.
5. Librerías externas de toasts, modales, gráficos, formularios, validación o estado global.
6. CSS modules, styled-components, Sass, estilos inline para layout/tipografía/colores.
   Las únicas excepciones admitidas son valores dinámicos calculados (por ejemplo, el ancho
   de una barra de progreso o de un gráfico) vía `style`.
7. `console.log` de datos de usuario, tokens o payloads en producción.
8. Tocar `Backend/`, leer sus `.env` o modificar la raíz del repositorio.
9. Ejecutar el backend con `--reload`.

---

## 7. Contrato de API (resumen operativo)

Prefijo global: `/api/v1`. Detalle completo, ejemplos JSON y errores: `Frontend/PRD.md §5`.

| Método | Ruta | Rol requerido | Uso en frontend |
|---|---|---|---|
| POST | `/auth/login` | público | LoginPage |
| GET | `/auth/me` | autenticado | Revalidar sesión al arrancar |
| GET | `/usuarios` | ADMIN | UsuariosPage |
| POST | `/usuarios` | ADMIN | UsuariosPage |
| PATCH | `/usuarios/{id}/estado` | ADMIN | UsuariosPage |
| PATCH | `/usuarios/{id}/password` | ADMIN | UsuariosPage |
| GET | `/clientes?busqueda=` | sesión | ClientesPage, RecojosPage |
| POST | `/clientes` | sesión | ClientesPage |
| PUT | `/clientes/{id}` | sesión | ClientesPage |
| GET | `/empleados` | sesión | OperacionesPage, RecojosPage, UsuariosPage |
| POST | `/empleados` | ADMIN | OperacionesPage |
| POST | `/empleados/{id}/cargo` | ADMIN | OperacionesPage |
| GET | `/empleados/{id}/historial` | sesión | OperacionesPage |
| GET | `/flota` | sesión | OperacionesPage, RecojosPage |
| POST | `/flota` | ADMIN | OperacionesPage |
| GET | `/catalogos` | sesión | `useCatalogos` en todas las vistas con formularios |
| GET | `/recojos?id_estado=` | sesión | RecojosPage |
| POST | `/recojos` | sesión | RecojosPage |
| PATCH | `/recojos/{id}/estado` | sesión | RecojosPage |
| GET | `/dashboard/indicadores` | sesión | DashboardPage |
| GET | `/dashboard/kg-por-tipo-residuo` | sesión | DashboardPage |
| GET | `/externo/clima-huancayo` | sesión | DashboardPage |
| GET | `/externo/ruc/{ruc}` | sesión | ClientesPage |
| GET | `/externo/dni/{dni}` | sesión | OperacionesPage |

Notas de contrato:

- `ADMIN` es el único rol con permisos administrativos; el otro rol es `EMPLEADO`.
- El backend no exige JWT en los GET de negocio ni en escrituras de clientes/recojos. El
  frontend **igualmente** protege esas rutas por sesión y envía el token; no se relaja la UI
  por esta diferencia.
- Los catálogos llegan como `{ distritos, cargos, tipos_vehiculo, tipos_residuo,
  estados_recojo, centros_reciclaje }` y cada ítem con forma `{ id, nombre }`. Se accede de
  forma defensiva (`item.id ?? item.id_distrito ?? item.id_cargo`) y se normaliza a
  `{ id, nombre }` antes de renderizar.
- Los POST/PUT/PATCH devuelven `{ mensaje }`: tras una mutación se recarga la lista
  correspondiente para reflejar el cambio real.

---

## 8. Autenticación y sesión

- `context/AuthContext.jsx` expone `{ usuario, token, autenticado, cargando, login, logout }`.
- Persistencia en `localStorage`:
  - `ecohuancayo_token` → `access_token`.
  - `ecohuancayo_usuario` → objeto `usuario` serializado.
- Al arrancar: si hay token, se valida con `GET /auth/me`; si falla con 401/403, se limpia la
  sesión y se redirige a `/login`.
- `login(correo, password)` llama a `authService.login`, guarda token y usuario, y devuelve el
  usuario para que la página redirija.
- `logout()` limpia `localStorage`, el estado y navega a `/login`; muestra toast `info`.
- `ProtectedRoute.jsx`: si no hay sesión → `<Navigate to="/login" replace />`; si hay
  `allowedRoles` y el rol no coincide → redirige a `/dashboard` con toast `error`
  "No tienes permisos para acceder a esta sección".
- `MainLayout.jsx` compone `Sidebar`, `Topbar` y `<Outlet />`. El ítem "Usuarios" solo se
  renderiza para `ADMIN`.
- Prohibido guardar contraseñas, hashes o payloads sensibles en el storage.

---

## 9. Sistema de notificaciones Toast (global)

Archivos obligatorios:

- `src/context/ToastContext.jsx`
- `src/components/ui/ToastContainer.jsx`

Construido **100 % con Tailwind CSS v4 + Lucide React**. Sin librerías y sin diálogos nativos.

### 9.1 API

```js
const { toast, dismiss } = useToast();

toast.success("Usuario registrado correctamente");
toast.error(detail);
toast.warning("Servicio SUNAT no disponible. Complete los datos manualmente.");
toast.info("Sesión cerrada");
```

- `toast.success | error | warning | info(mensaje, opciones?)`.
- `opciones`: `{ titulo?, duracion? }`; `duracion` por defecto **4000 ms**.
- `dismiss(id)` cierra manualmente.
- `ToastProvider` se monta en `App.jsx` **por fuera de `AuthProvider`**, para que el manejo de
  sesión y el interceptor 401 también puedan notificar.
- `ToastContainer` se renderiza una sola vez dentro del provider (no por página).

### 9.2 Tipos visuales

| Tipo | Color | Icono Lucide | ARIA |
|---|---|---|---|
| `success` | Esmeralda (`emerald-600` / `emerald-50`) | `CheckCircle2` | `role="status"`, `aria-live="polite"` |
| `error` | Rojo (`red-600` / `red-50`) | `XCircle` | `role="alert"`, `aria-live="assertive"` |
| `warning` | Ámbar (`amber-500` / `amber-50`) | `AlertTriangle` | `role="alert"`, `aria-live="assertive"` |
| `info` | Azul/pizarra (`sky-600` / `slate-50`) | `Info` | `role="status"`, `aria-live="polite"` |

Cada toast incluye: borde izquierdo de color, icono, título opcional, mensaje, botón de cierre
(`X`, `aria-label="Cerrar notificación"`) y barra de progreso inferior.

### 9.3 Comportamiento

- Auto-cierre a los **4000 ms** con barra de progreso lineal de 100 % a 0 %.
- Pausa del temporizador y de la barra al `hover`/`focus` dentro del toast.
- Cierre manual inmediato con el botón `X`.
- Stack máximo de **4** toasts visibles; al superar, se descarta el más antiguo.
- Posición: `fixed` arriba a la derecha en `md+`; arriba y centrado a ancho completo en móvil.
- Animación de entrada 200 ms (translate + fade) y de salida 150 ms; se respeta
  `prefers-reduced-motion`.
- `z-index` superior al de modales.

### 9.4 Reglas de uso

- **Los `services/` no disparan toasts.** Solo `pages/`, `hooks/` de presentación y `context/`.
- `success`: registrar usuario, cambiar contraseña, guardar cliente/empleado/vehículo,
  registrar recojo y actualizar estado de recojo.
- `error`: validaciones de formulario y `detail` de HTTP. Nunca mostrar objetos crudos.
- `warning`: respuesta `manual: true` de SUNAT, RENIEC o Clima.
- `info`: avisos neutros (sesión cerrada, datos recargados, filtro aplicado).
- Un mismo error no se duplica: validar en cliente y mostrar el error inline; el toast se
  reserva para el resultado de la operación o errores no ligados a un campo.

---

## 10. Modales de confirmación

Archivo obligatorio: `src/components/ui/ConfirmModal.jsx`.

- Props: `{ abierto, titulo, mensaje, children?, confirmarTexto, cancelarTexto, variante,
  cargando, onConfirmar, onCerrar }`.
- `variante`: `"peligro"` (rojo) o `"advertencia"` (ámbar).
- Overlay con `bg-slate-900/50 backdrop-blur-sm`, tarjeta blanca `rounded-2xl`, icono de
  advertencia, foco atrapado, cierre con `Escape`, `role="dialog"`, `aria-modal="true"` y
  `aria-labelledby`.
- Botón confirmar con estado `cargando` (spinner + texto "Procesando…") y deshabilitado
  mientras se ejecuta la petición.
- Uso obligatorio para acciones críticas:
  - Activar/desactivar un usuario.
  - Cambiar la contraseña de un usuario (incluye campos de nueva contraseña y confirmación).
- Prohibido `window.confirm`. Cualquier otra acción destructiva futura usa este componente.

---

## 11. Estilizado con Tailwind CSS v4

- `src/index.css` contiene exactamente el import de Tailwind y los tokens/keyframes:

```css
@import "tailwindcss";
```

- Configuración CSS-first: colores, radios y animaciones se declaran con `@theme` en
  `index.css`. No se crea `tailwind.config.js` salvo necesidad justificada.
- Paleta corporativa:
  - Primario: esmeralda (`emerald-600`, hover `emerald-700`, superficies `emerald-50/100`).
  - Neutro: pizarra (`slate-900` texto, `slate-600` secundario, `slate-200` bordes).
  - Base: blanco limpio (`bg-white`, `bg-slate-50` fondo de app).
  - Semánticos: `red-600` error, `amber-500` advertencia, `sky-600` info.
- Diseño **mobile-first**: partir de una columna y escalar con `sm:`, `md:`, `lg:`, `xl:`.
  Tablas → tarjetas apiladas en móvil; sidebar → drawer con overlay.
- Componentes: tarjetas `rounded-2xl bg-white shadow-sm ring-1 ring-slate-200`,
  inputs con `focus-visible:ring-2 ring-emerald-500`, botones con `transition-colors
  duration-200` y estados `disabled:`.
- Animaciones suaves y contenidas: `transition`, `duration-200`, `ease-out`, `animate-pulse`
  para skeletons. Nada de animaciones largas ni rebotes.
- Accesibilidad: `label` asociado a cada input, foco visible, contraste AA, iconos
  decorativos con `aria-hidden="true"`, botones icono con `aria-label`.
- Prohibido usar colores arbitrarios fuera de la paleta sin justificación.

---

## 12. Validaciones estrictas en cliente

Todas viven en `src/utils/validaciones.js` y se ejecutan **antes** de llamar al servicio.
Los errores se muestran inline por campo; el toast `error` se usa para el resultado global.

| Regla | Especificación |
|---|---|
| RUC | Exactamente 11 dígitos numéricos y prefijo `10` o `20` → `/^(10|20)\d{9}$/` |
| DNI | Exactamente 8 dígitos → `/^\d{8}$/` |
| Correo | Formato válido → `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` |
| Placa | Normalizar a mayúsculas y sin espacios; aceptar `ABC-123`, `AB-1234`, `A1B-234`; guardar con guion |
| Peso de residuo | Numérico `> 0`, máximo 2 decimales |
| Capacidad de vehículo | Numérico `> 0` |
| Capacidad del recojo | Suma de `peso_kg` ≤ `capacidad_kg` del vehículo seleccionado |
| Contraseña | Mínimo 8 caracteres (contrato backend) y confirmación idéntica |
| Razón social / nombres / apellidos | No vacíos tras `trim()` |
| Teléfono (opcional) | 6 a 15 caracteres numéricos, `+`, espacio o guion |
| Fecha/hora de recojo | Obligatorias; fecha `YYYY-MM-DD`, hora `HH:mm` → enviar `HH:mm:ss` |
| Residuos | Al menos 1; tipos únicos; peso válido por fila |
| Empleados asignados | Opcionales; ids únicos |
| Selects de catálogo | Obligatorios y pertenecientes a la lista cargada |

Los mensajes de error deben ser claros, en español y junto al campo. Nunca bloquear el envío
sin explicar qué corregir.

---

## 13. Manejo obligatorio de `manual: true`

Los endpoints externos responden `200` con `{ manual: true, mensaje }` cuando el proveedor falla
(SUNAT/RUC, RENIEC/DNI, Clima Huancayo). El frontend **no debe romperse**:

1. Detectar `respuesta.manual === true` (comparación estricta, tolerando `null`).
2. Mostrar **toast `warning`** con `respuesta.mensaje` o el texto por defecto:
   "El servicio externo no está disponible. Puede completar los datos manualmente."
3. Mostrar un aviso inline ámbar persistente en el formulario/sección.
4. **Habilitar la captura manual** de los campos dependientes:
   - RUC → razón social y dirección editables.
   - DNI → nombres y apellidos editables.
   - Clima → tarjeta informativa con estado "no disponible", sin bloquear el dashboard.
5. Nunca lanzar excepción, nunca dejar el formulario en estado de carga y nunca impedir el
   guardado por este motivo.
6. Si `manual === false`, autocompletar de forma defensiva con `??` y sin sobrescribir lo que
   el usuario ya escribió (pedir confirmación implícita mostrando los datos).
7. El payload final se envía con los valores del formulario, provengan del proveedor o de
   captura manual.

---

## 14. Manejo de errores HTTP

- Extraer siempre `detail` con `getApiError(error)`.
- Mapeo mínimo:
  - `400` → mensaje limpio de BD; toast `error` + mantener el formulario abierto.
  - `401` → sesión inválida; logout y redirección (salvo login).
  - `403` → "Usuario inactivo. Contacte al administrador" o "Se requieren permisos de
    administrador"; toast `error`.
  - `422` → unir los `msg` de Pydantic en un mensaje legible.
  - `500` / red caída → "No se pudo conectar con el servidor. Intente nuevamente."
- Cada vista maneja: `cargando` (skeleton/spinner), `error` (bloque con reintento), `vacío`
  (EmptyState) y `datos`.
- Prohibido mostrar stack traces, objetos JSON crudos o detalles internos.

---

## 15. Ejecución, variables de entorno y despliegue

### 15.1 Variables

- Única variable: `VITE_API_URL`, con la base **incluyendo** `/api/v1`:
  `http://localhost:8000/api/v1`.
- Se documenta en `Frontend/.env.example` con un placeholder. Nunca se versiona `.env`.
- Prohibido cualquier otro origen hardcodeado.

### 15.2 Local

```bash
npm install
npm run dev       # Vite en http://localhost:5173
npm run build
npm run lint
```

Backend local (referencia, sin `--reload`): `uv run uvicorn backend.main:app`.

### 15.3 Render — Static Site

- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment Variable: `VITE_API_URL` = URL pública del backend + `/api/v1`
- Rewrite SPA: `/*` → `/index.html` con status `200`.
- `public/_redirects` versionado con:

```text
/* /index.html 200
```

- El dominio del Static Site debe estar incluido en `CORS_ORIGINS` del backend (configuración
  del equipo backend; el frontend no la modifica).

### 15.4 CI/CD — GitHub Actions

Archivo: `Frontend/.github/workflows/frontend-ci.yml` (si `Frontend/` es la raíz del repo,
equivale a `.github/workflows/frontend-ci.yml`).

- Disparadores: `push` a `main` y `pull_request`, filtrando por `Frontend/**`.
- Node 22 con caché de `npm` y `Frontend/package-lock.json`.
- Pasos: `npm ci` → `npm run lint` → `npm run build`.
- En `push` a `main`: `curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"` usando un secreto de
  GitHub. El hook nunca se escribe en el repo.
- `working-directory: Frontend` en todos los pasos.

---

## 16. Checklist antes de terminar un cambio

- [ ] Solo se modificaron archivos dentro de `Frontend/`.
- [ ] `Backend/` intacto y ningún `.env` leído o copiado.
- [ ] Cero `fetch` y cero `axios` fuera de `api/` y `services/`.
- [ ] Cero URLs hardcodeadas; solo `VITE_API_URL`.
- [ ] Cero `window.alert` / `window.confirm`; toasts y `ConfirmModal` en su lugar.
- [ ] Toasts con los 4 tipos, auto-cierre a 4 s, barra de progreso y cierre manual.
- [ ] Validaciones de RUC, DNI, placa, pesos, capacidad, correo y contraseña aplicadas.
- [ ] `manual: true` manejado con warning + captura manual en SUNAT, RENIEC y Clima.
- [ ] Errores HTTP muestran `detail` de forma legible.
- [ ] Responsive verificado en 360 px, 768 px y 1280 px.
- [ ] `npm run lint` y `npm run build` en verde.
- [ ] `public/_redirects` presente y sin `--reload` en ninguna instrucción.
