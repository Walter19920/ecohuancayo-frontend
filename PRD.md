# PRD — Frontend EcoHuancayo S.A.C.

| Campo | Valor |
|---|---|
| Producto | Frontend SPA de gestión de recojo de residuos |
| Cliente | EcoHuancayo S.A.C. |
| Versión | 1.0 |
| Estado | Aprobado para implementación |
| Stack | React 19 + Vite 8 + Tailwind CSS v4 + Axios + React Router DOM 7 + Lucide React |
| Backend | FastAPI existente, prefijo `/api/v1` (no se modifica) |
| Fuente del contrato | `Backend/src/backend/apis`, `schemas` y `core/config.py` |

---

## 1. Resumen

EcoHuancayo S.A.C. necesita una aplicación web para operar el ciclo de recojo de residuos:
autenticarse, visualizar indicadores, registrar y dar seguimiento a recojos, administrar
clientes, gestionar empleados y flota, y administrar usuarios del sistema.

El backend FastAPI ya está finalizado, probado y conectado a PostgreSQL (Supabase). Este
documento especifica **exclusivamente el frontend**: vistas, roles, contrato consumido,
validaciones, notificaciones, diseño y despliegue.

La aplicación se entrega como SPA desplegada en **Render Static Site**, con CI en GitHub
Actions y comunicación con la API mediante `VITE_API_URL`.

---

## 2. Objetivos

1. Digitalizar el registro y seguimiento de recojos con trazabilidad de estado.
2. Centralizar clientes, empleados, vehículos y usuarios en una sola interfaz.
3. Reducir errores de captura con validaciones estrictas en cliente (RUC, DNI, placa, pesos,
   capacidad, correos).
4. Dar visibilidad operativa mediante un dashboard con indicadores y kg por tipo de residuo.
5. Tolerar fallos de servicios externos (SUNAT, RENIEC, Clima) sin bloquear la operación,
   habilitando captura manual.
6. Ofrecer una experiencia responsive, accesible y con retroalimentación inmediata (toasts y
   modales de confirmación).

### Métricas de éxito

- 100 % de las acciones críticas con confirmación visual (toast o modal).
- 0 usos de `window.alert` / `window.confirm`.
- 0 peticiones HTTP fuera de la capa `services/`.
- Formularios que impiden el envío de datos inválidos antes de llegar al backend.
- Navegación completa en móvil (360 px) sin scroll horizontal.

---

## 3. Alcance

### Incluido

- Login con JWT y sesión persistente en `localStorage`.
- Layout protegido con sidebar, topbar y contenido.
- 6 vistas: Login, Dashboard, Recojos, Clientes, Operaciones, Usuarios.
- Consumo de los 24 endpoints reales del backend.
- Validaciones de cliente y visualización de errores `detail`.
- Sistema global de toasts y modales de confirmación.
- Manejo de `manual: true` en SUNAT, RENIEC y Clima Huancayo.
- CI con GitHub Actions y despliegue en Render Static Site.

### Excluido

- Cambios en `Backend/` (código, configuración, `.env`, CORS).
- Nuevos endpoints o cambios de contrato.
- Registro público de usuarios (solo ADMIN crea usuarios).
- Recuperación de contraseña por correo.
- Reportes exportables (PDF/Excel), mapas o geolocalización.
- Notificaciones push, correo o websockets.
- Pruebas E2E automatizadas y suite unitaria (el CI valida lint y build).

---

## 4. Actores y permisos

### Roles del backend

| Rol | Descripción |
|---|---|
| `ADMIN` | Acceso total: usuarios, registro de empleados, vehículos y asignación de cargos. |
| `EMPLEADO` | Operación diaria: dashboard, recojos, clientes y consulta de empleados/flota. |

### Matriz de permisos por vista

| Vista / Acción | ADMIN | EMPLEADO |
|---|:---:|:---:|
| Login | ✔ | ✔ |
| Dashboard (indicadores, gráfico, clima) | ✔ | ✔ |
| Recojos: listar y filtrar | ✔ | ✔ |
| Recojos: registrar | ✔ | ✔ |
| Recojos: actualizar estado | ✔ | ✔ |
| Clientes: listar y buscar | ✔ | ✔ |
| Clientes: registrar y editar | ✔ | ✔ |
| Operaciones: ver empleados y flota | ✔ | ✔ |
| Operaciones: ver historial de cargos | ✔ | ✔ |
| Operaciones: registrar empleado | ✔ | ✖ |
| Operaciones: asignar cargo | ✔ | ✖ |
| Operaciones: registrar vehículo | ✔ | ✖ |
| Usuarios: listar, crear, activar/desactivar, cambiar contraseña | ✔ | ✖ |

Reglas de UI:

- Los botones de acciones no permitidas **no se renderizan** para `EMPLEADO`.
- La ruta `/usuarios` está protegida con `allowedRoles={["ADMIN"]}`; un acceso directo
  redirige a `/dashboard` con toast `error`.
- El backend solo exige JWT/ADMIN en `/usuarios*`, `POST /empleados`,
  `POST /empleados/{id}/cargo` y `POST /flota`. El frontend aplica la matriz completa por
  decisión de producto.

---

## 5. Arquitectura

### 5.1 Principios

- React idiomático con flujo unidireccional estricto.
- Separación por capas: presentación (`pages/`, `components/`), dominio de acceso
  (`services/`), transporte (`api/`), estado transversal (`context/`, `hooks/`).
- Sin estado global de servidor: cada vista pide sus datos y los mantiene localmente.
- Sin dependencias adicionales.

### 5.2 Flujos obligatorios

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

```text
App.jsx -> context/ToastContext.jsx -> components/ui/ToastContainer.jsx
pages/  -> components/ui/ConfirmModal.jsx
```

### 5.3 Estructura

```text
Frontend/
├── public/_redirects
├── src/
│   ├── api/axiosClient.js
│   ├── services/{auth,usuario,cliente,empleado,flota,catalogo,recojo,dashboard,externo}Service.js
│   ├── hooks/useCatalogos.js
│   ├── context/{AuthContext,ToastContext}.jsx
│   ├── components/layout/{ProtectedRoute,MainLayout,Sidebar,Topbar}.jsx
│   ├── components/ui/{ToastContainer,ConfirmModal,Modal,Button,Input,Select,Table,Badge,
│   │                   EmptyState,Spinner,PageHeader}.jsx
│   ├── pages/{LoginPage,DashboardPage,RecojosPage,ClientesPage,OperacionesPage,UsuariosPage}.jsx
│   ├── utils/{validaciones,formatos,errores}.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .github/workflows/frontend-ci.yml
├── index.html
├── package.json
└── vite.config.js
```

### 5.4 Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/login` | `LoginPage` | Pública (si hay sesión → `/dashboard`) |
| `/dashboard` | `DashboardPage` | Autenticado |
| `/recojos` | `RecojosPage` | Autenticado |
| `/clientes` | `ClientesPage` | Autenticado |
| `/operaciones` | `OperacionesPage` | Autenticado |
| `/usuarios` | `UsuariosPage` | Solo `ADMIN` |
| `/` | Redirección | → `/dashboard` |
| `*` | No encontrada | → `/dashboard` |

### 5.5 Capa HTTP

`api/axiosClient.js`:

- `baseURL = import.meta.env.VITE_API_URL` (incluye `/api/v1`).
- Interceptor de request: `Authorization: Bearer <token>` si existe.
- Interceptor de response: `401` → limpieza de sesión y `/login` (salvo en login).
- `getApiError(error)` prioriza `detail`, luego `message`, luego texto genérico; une arrays de
  `msg` de Pydantic.
- Ningún componente de `pages/` importa Axios ni usa `fetch`.

---

## 6. Contrato de API real

### 6.1 Convenciones

- Base: `{VITE_API_URL}` = `https://<backend>/api/v1`.
- Auth: `Authorization: Bearer <access_token>`.
- Fechas `YYYY-MM-DD`; horas `HH:MM:SS`.
- Mutaciones devuelven `{ "mensaje": "..." }`; después se recarga la lista afectada.
- Errores devuelven `{ "detail": "..." }`.

### 6.2 Endpoints

| # | Método | Ruta | Auth | Cuerpo / Query | Respuesta |
|---|---|---|---|---|---|
| 1 | POST | `/auth/login` | — | `{correo, password}` | `TokenResponse` |
| 2 | GET | `/auth/me` | Bearer | — | `UsuarioSesion` |
| 3 | GET | `/usuarios` | ADMIN | — | `UsuarioOut[]` |
| 4 | POST | `/usuarios` | ADMIN | `UsuarioCreate` | `{mensaje}` |
| 5 | PATCH | `/usuarios/{id_usuario}/estado` | ADMIN | `{estado}` | `{mensaje}` |
| 6 | PATCH | `/usuarios/{id_usuario}/password` | ADMIN | `{nueva_password}` | `{mensaje}` |
| 7 | GET | `/clientes` | — | `?busqueda=` | `ClienteOut[]` |
| 8 | POST | `/clientes` | — | `ClienteCreate` | `{mensaje}` |
| 9 | PUT | `/clientes/{id_cliente}` | — | `ClienteUpdate` | `{mensaje}` |
| 10 | GET | `/empleados` | — | — | `EmpleadoOut[]` |
| 11 | POST | `/empleados` | ADMIN | `EmpleadoCreate` | `{mensaje}` |
| 12 | POST | `/empleados/{id_empleado}/cargo` | ADMIN | `{id_cargo}` | `{mensaje}` |
| 13 | GET | `/empleados/{id_empleado}/historial` | — | — | `HistorialCargoOut[]` |
| 14 | GET | `/flota` | — | — | `VehiculoOut[]` |
| 15 | POST | `/flota` | ADMIN | `VehiculoCreate` | `{mensaje}` |
| 16 | GET | `/catalogos` | — | — | `CatalogosOut` |
| 17 | GET | `/recojos` | — | `?id_estado=` | `RecojoOut[]` |
| 18 | POST | `/recojos` | — | `RecojoCreate` | `{mensaje}` |
| 19 | PATCH | `/recojos/{id_recojo}/estado` | — | `{id_estado_recojo}` | `{mensaje}` |
| 20 | GET | `/dashboard/indicadores` | — | — | `IndicadoresOut` |
| 21 | GET | `/dashboard/kg-por-tipo-residuo` | — | — | `KgPorTipoResiduoOut[]` |
| 22 | GET | `/externo/clima-huancayo` | — | — | `RespuestaExterna` |
| 23 | GET | `/externo/ruc/{ruc}` | — | — | `RespuestaExterna` |
| 24 | GET | `/externo/dni/{dni}` | — | — | `RespuestaExterna` |

> Los GET de negocio y las escrituras de clientes/recojos no exigen JWT en el backend. El
> frontend mantiene la sesión y adjunta el token igualmente.

### 6.3 Estructuras JSON

**TokenResponse**

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "usuario": {
    "id_usuario": 1,
    "id_empleado": 4,
    "correo": "admin@ecohuancayo.pe",
    "nombre_completo": "Ana Quispe",
    "rol": "ADMIN"
  }
}
```

**UsuarioOut**

```json
{
  "id_usuario": 1,
  "id_empleado": 4,
  "nombre_completo": "Ana Quispe",
  "dni": "12345678",
  "correo": "admin@ecohuancayo.pe",
  "rol": "ADMIN",
  "estado": true,
  "fecha_creacion": "2026-11-22T08:30:00"
}
```

**UsuarioCreate** — `id_empleado` obligatorio (debe existir), `password` mínimo 8,
`rol` ∈ `{ADMIN, EMPLEADO}`:

```json
{ "id_empleado": 4, "correo": "nuevo@ecohuancayo.pe", "password": "Secreta123", "rol": "EMPLEADO" }
```

**ClienteOut / ClienteCreate / ClienteUpdate**

```json
{
  "id_cliente": 3,
  "razon_social": "Comercial Andina S.A.C.",
  "ruc": "20123456789",
  "direccion": "Av. Giraldez 123, Huancayo",
  "correo": "contacto@andina.pe",
  "telefono": "964123456",
  "estado": true
}
```

```json
// POST /clientes (ruc obligatorio, 11 caracteres)
{
  "razon_social": "Comercial Andina S.A.C.",
  "ruc": "20123456789",
  "direccion": "Av. Giraldez 123, Huancayo",
  "correo": "contacto@andina.pe",
  "telefono": "964123456"
}
```

```json
// PUT /clientes/{id} — el RUC NO se actualiza
{
  "razon_social": "Comercial Andina S.A.C.",
  "direccion": "Av. Giraldez 456, Huancayo",
  "correo": "contacto@andina.pe",
  "telefono": "964123456",
  "estado": true
}
```

**EmpleadoOut / EmpleadoCreate / HistorialCargoOut**

```json
{
  "id_empleado": 4,
  "nombres": "Luis",
  "apellidos": "Paredes Rojas",
  "dni": "12345678",
  "telefono": "964123456",
  "id_cargo_actual": 2,
  "cargo_actual": "Conductor",
  "estado": true
}
```

```json
{ "nombres": "Luis", "apellidos": "Paredes Rojas", "dni": "12345678", "telefono": "964123456", "id_cargo": 2 }
```

```json
{ "id_empleado_cargo": 9, "nombre_cargo": "Conductor", "fecha_inicio": "2026-01-15", "fecha_fin": null, "estado": true }
```

**VehiculoOut / VehiculoCreate**

```json
{ "id_vehiculo": 1, "id_tipo_vehiculo": 2, "tipo_vehiculo": "Camión", "placa": "ABC-123", "capacidad_kg": 3500.0, "estado": true }
```

```json
{ "id_tipo_vehiculo": 2, "placa": "ABC-123", "capacidad_kg": 3500.0 }
```

**CatalogosOut**

```json
{
  "distritos": [{ "id": 1, "nombre": "Huancayo" }],
  "cargos": [{ "id": 2, "nombre": "Conductor" }],
  "tipos_vehiculo": [{ "id": 2, "nombre": "Camión" }],
  "tipos_residuo": [{ "id": 4, "nombre": "Plástico" }],
  "estados_recojo": [{ "id": 1, "nombre": "PENDIENTE" }],
  "centros_reciclaje": [{ "id": 2, "nombre": "Centro Huancayo" }]
}
```

Los ítems se normalizan a `{ id, nombre }` con acceso defensivo a variantes de clave.

**RecojoOut**

```json
{
  "id_recojo": 5,
  "cliente": "Cliente Demo",
  "ruc": "20123456789",
  "centro_reciclaje": "Centro Huancayo",
  "distrito_destino": "El Tambo",
  "vehiculo_placa": "ABC-123",
  "id_estado_recojo": 2,
  "estado_recojo": "PENDIENTE",
  "fecha_recojo": "2026-11-22",
  "hora_recojo": "08:30:00",
  "total_kg": 12.5
}
```

**RecojoCreate**

```json
{
  "id_vehiculo": 1,
  "id_centro_reciclaje": 2,
  "id_cliente": 3,
  "id_estado_recojo": 1,
  "fecha_recojo": "2026-11-22",
  "hora_recojo": "08:30:00",
  "residuos": [{ "id_tipo_residuo": 4, "peso_kg": 10.5 }],
  "empleados": [{ "id_empleado": 7 }]
}
```

**EstadoRecojoUpdate** — `{ "id_estado_recojo": 3 }`.

**IndicadoresOut**

```json
{
  "total_recojos": 42,
  "total_kg_reciclados": 1580.75,
  "clientes_activos": 18,
  "vehiculos_disponibles": 5,
  "recojos_completados": 30,
  "recojos_pendientes": 12
}
```

**KgPorTipoResiduoOut**

```json
[{ "tipo_residuo": "Plástico", "total_kg": 620.5 }, { "tipo_residuo": "Cartón", "total_kg": 410.25 }]
```

**RespuestaExterna** — `extra="allow"`:

```json
// Éxito
{ "manual": false, "ruc": "20123456789", "razon_social": "...", "...": "..." }
```

```json
// Fallback
{ "manual": true, "mensaje": "El servicio externo no está disponible. Puede completar los datos manualmente." }
```

### 6.4 Catálogo de errores

| HTTP | `detail` real | Tratamiento frontend |
|---|---|---|
| 400 | Mensaje limpio de la BD (RAISE EXCEPTION) | Toast `error`; formulario abierto |
| 401 | `Credenciales inválidas` | En login: error inline. Fuera de login: logout + toast |
| 401 | `Token inválido o expirado` / `No autenticado` | Logout y redirección a `/login` |
| 403 | `Usuario inactivo. Contacte al administrador` | Toast `error`; no guardar sesión |
| 403 | `Se requieren permisos de administrador` | Toast `error`; volver a `/dashboard` |
| 422 | Lista de `msg` de Pydantic | Unir en un mensaje legible |
| 5xx / red | — | `No se pudo conectar con el servidor. Intente nuevamente.` |

---

## 7. Notificaciones globales y confirmaciones

### 7.1 Objetivo

Toda la retroalimentación de la aplicación pasa por un sistema propio, consistente y accesible.
**Prohibido** `window.alert`, `window.confirm` y cualquier librería externa.

### 7.2 Componentes

**`context/ToastContext.jsx`**

- `ToastProvider` mantiene la cola de toasts y expone `useToast()`.
- API:

```js
const { toast, dismiss } = useToast();
toast.success("Recojo registrado correctamente");
toast.error(detail);
toast.warning("Servicio SUNAT no disponible. Complete los datos manualmente.");
toast.info("Sesión cerrada");
```

- Cada toast: `{ id, tipo, titulo?, mensaje, duracion }`.
- Duración por defecto: **4000 ms**.
- Máximo 4 visibles; al superar, se descarta el más antiguo (FIFO).
- Se monta en `App.jsx` por fuera de `AuthProvider` para cubrir también el manejo de sesión.

**`components/ui/ToastContainer.jsx`**

- Renderizado único, `fixed` arriba a la derecha en `md+` y arriba centrado en móvil.
- `z-index` superior a los modales.
- Estructura por toast: icono Lucide, título opcional, mensaje, botón `X`, barra de progreso.
- Animaciones: entrada 200 ms (fade + translate), salida 150 ms, progreso lineal 4000 ms.
- Pausa de temporizador y barra en `hover`/`focus` dentro del toast.
- `prefers-reduced-motion`: sin desplazamientos, solo fade.

**`components/ui/ConfirmModal.jsx`**

- Props: `{ abierto, titulo, mensaje, children?, confirmarTexto, cancelarTexto, variante,
  cargando, onConfirmar, onCerrar }`.
- Variantes: `peligro` (rojo) y `advertencia` (ámbar).
- Overlay `bg-slate-900/50 backdrop-blur-sm`; tarjeta `rounded-2xl bg-white`.
- Foco atrapado, cierre con `Escape`, `role="dialog"`, `aria-modal="true"`,
  `aria-labelledby`, botón confirmar deshabilitado mientras `cargando`.
- Admite `children` para formularios (cambio de contraseña).

### 7.3 Tipos visuales

| Tipo | Uso | Color | Icono | ARIA |
|---|---|---|---|---|
| `success` | Operación completada | Esmeralda | `CheckCircle2` | `status` / `polite` |
| `error` | Validación o `detail` | Rojo | `XCircle` | `alert` / `assertive` |
| `warning` | `manual: true` | Ámbar | `AlertTriangle` | `alert` / `assertive` |
| `info` | Aviso neutro | Azul/pizarra | `Info` | `status` / `polite` |

### 7.4 Mapa de disparo

| Acción | Resultado | Notificación |
|---|---|---|
| Login correcto | 200 | `success` "Bienvenido, {nombre}" |
| Login inválido | 401/403 | `error` con `detail` |
| Registrar usuario | 200 | `success` "Usuario registrado correctamente" |
| Activar/desactivar usuario | 200 | `success` "Estado del usuario actualizado correctamente" |
| Cambiar contraseña | 200 | `success` "Contraseña actualizada correctamente" |
| Guardar cliente (POST/PUT) | 200 | `success` "Cliente registrado/actualizado correctamente" |
| Registrar empleado | 200 | `success` "Empleado registrado correctamente" |
| Asignar cargo | 200 | `success` "Cargo asignado correctamente" |
| Registrar vehículo | 200 | `success` "Vehículo registrado correctamente" |
| Registrar recojo | 200 | `success` "Recojo registrado correctamente" |
| Actualizar estado de recojo | 200 | `success` "Estado del recojo actualizado correctamente" |
| Consulta SUNAT/RENIEC/Clima con fallback | `manual: true` | `warning` con `mensaje` |
| Error de validación local | — | `error` (y mensajes inline) |
| Logout | — | `info` "Sesión cerrada" |

Regla: los `services/` no notifican; solo `pages/`, `hooks/` de presentación y `context/`.

---

## 8. Vistas

### 8.1 `LoginPage` — `/login`

**Propósito:** autenticar al usuario y establecer la sesión.

**Acceso:** público. Si ya hay sesión válida, redirige a `/dashboard`.

**Layout:** pantalla completa en dos paneles en `lg+` (branding ecológico + formulario) y una
sola columna en móvil. Tarjeta blanca centrada, logo/icono `Recycle`, título
"EcoHuancayo S.A.C." y subtítulo "Gestión de recojo de residuos".

**Datos y servicios:** `authService.login(correo, password)`.

**Campos y validaciones:**

| Campo | Regla |
|---|---|
| Correo | Obligatorio, formato de correo válido |
| Contraseña | Obligatoria, mínimo 1 carácter (el backend valida) |

**Comportamiento:**

- Botón con spinner y deshabilitado durante el envío.
- Mostrar/ocultar contraseña con `Eye` / `EyeOff`.
- Éxito: guarda token y usuario, toast `success`, redirige a la ruta previa
  (`location.state?.from`) o `/dashboard`.
- 401: error inline "Credenciales inválidas" + toast `error`.
- 403: toast `error` "Usuario inactivo. Contacte al administrador".
- Error de red: mensaje genérico con reintento.

**Criterios de aceptación:**

- No se puede enviar con correo vacío o inválido.
- La sesión persiste al recargar.
- Un usuario inactivo nunca obtiene sesión.

---

### 8.2 `DashboardPage` — `/dashboard`

**Propósito:** dar una vista ejecutiva del estado operativo.

**Acceso:** ADMIN y EMPLEADO.

**Datos:**

- `GET /dashboard/indicadores`
- `GET /dashboard/kg-por-tipo-residuo`
- `GET /externo/clima-huancayo`

Se solicitan en paralelo con `Promise.allSettled`; el fallo de un bloque no tumba la vista.

**Composición:**

1. Encabezado con saludo, fecha actual y botón "Actualizar" (icono `RefreshCw`).
2. Seis tarjetas KPI con icono y color:
   - Total de recojos (`Truck`)
   - Kg reciclados (`Scale`)
   - Clientes activos (`Building2`)
   - Vehículos disponibles (`Car`)
   - Recojos completados (`CheckCircle2`)
   - Recojos pendientes (`Clock`)
3. Gráfico "Kg por tipo de residuo": barras horizontales nativas (HTML/CSS), escala relativa al
   máximo, etiqueta de tipo y valor en kg, color esmeralda degradado. Estado vacío si no hay datos.
4. Tarjeta "Clima en Huancayo": temperatura, humedad y viento si `manual: false`. Si
   `manual: true`, estado "No disponible" + aviso ámbar y toast `warning`; nunca rompe la vista.

**Estados:** skeletons `animate-pulse` durante la carga; bloque de error con botón "Reintentar";
`EmptyState` para el gráfico sin datos.

**Criterios de aceptación:**

- Los 6 indicadores se muestran formateados (miles y 2 decimales para kg).
- El gráfico no usa librerías externas.
- El fallback de clima no genera errores en consola ni bloquea la página.

---

### 8.3 `RecojosPage` — `/recojos`

**Propósito:** registrar, listar y actualizar el estado de los recojos.

**Acceso:** ADMIN y EMPLEADO (todas las acciones).

**Datos:**

- `GET /recojos?id_estado=` (filtro opcional)
- `GET /clientes`, `GET /flota`, `GET /empleados`
- `useCatalogos()` → `centros_reciclaje`, `estados_recojo`, `tipos_residuo`
- `POST /recojos`, `PATCH /recojos/{id}/estado`

**Listado:**

- Tabla en `md+` y tarjetas en móvil.
- Columnas: cliente (+RUC), centro/destino, vehículo, fecha y hora, total kg, estado (badge) y
  acciones.
- Filtro por estado con `Select` alimentado por `estados_recojo` + opción "Todos".
- Botón "Actualizar" y contador de resultados.

**Formulario "Nuevo recojo" (modal o panel lateral):**

| Campo | Tipo | Validación |
|---|---|---|
| Cliente | Select | Obligatorio; lista de clientes activos |
| Vehículo | Select | Obligatorio; solo `estado = true`; muestra placa y capacidad |
| Centro de reciclaje | Select | Obligatorio (catálogo) |
| Estado inicial | Select | Obligatorio (catálogo) |
| Fecha | `date` | Obligatoria, `YYYY-MM-DD` |
| Hora | `time` | Obligatoria; se envía `HH:MM:SS` |
| Residuos | Filas dinámicas tipo + peso | ≥ 1 fila; tipo único; peso > 0 |
| Empleados | Multi-select | Opcional; ids únicos |

- Total calculado en vivo: `Σ peso_kg`.
- Muestra "Capacidad del vehículo: X kg" y "Disponible: Y kg".
- Si el total supera `capacidad_kg`, error inline y botón Guardar deshabilitado.
- Botones "Agregar residuo" (`Plus`) y eliminar fila (`Trash2`).

**Actualizar estado:**

- `Select` por fila con los estados del catálogo + botón de confirmación (`Check`).
- `PATCH /recojos/{id}/estado` y toast `success`.
- Deshabilitado mientras la petición está en curso.

**Criterios de aceptación:**

- No se puede registrar un recojo sin residuos ni con pesos ≤ 0.
- El peso total nunca supera la capacidad del vehículo seleccionado.
- Tras registrar o cambiar estado, la lista se recarga y refleja el cambio.
- El filtro por estado llama al backend con `id_estado`.

---

### 8.4 `ClientesPage` — `/clientes`

**Propósito:** administrar el padrón de clientes.

**Acceso:** ADMIN y EMPLEADO.

**Datos:**

- `GET /clientes?busqueda=`
- `POST /clientes`, `PUT /clientes/{id}`
- `GET /externo/ruc/{ruc}` (SUNAT)

**Listado:**

- Buscador con debounce de 400 ms; envía `busqueda` al backend.
- Tabla/tarjetas: razón social, RUC, contacto (correo/teléfono), dirección, estado (badge) y
  acciones "Editar".
- `EmptyState` cuando no hay resultados.

**Formulario "Nuevo cliente":**

| Campo | Regla |
|---|---|
| Razón social | Obligatoria, no vacía |
| RUC | Obligatorio, 11 dígitos, prefijo 10 o 20 |
| Dirección | Opcional |
| Correo | Opcional; si existe, formato válido |
| Teléfono | Opcional; 6–15 caracteres válidos |

- Botón "Consultar SUNAT" junto al RUC, habilitado solo con RUC válido.
- Éxito (`manual: false`): autocompletar razón social/dirección de forma defensiva.
- Fallback (`manual: true`): toast `warning`, aviso inline ámbar y campos editables para
  captura manual. El guardado nunca se bloquea.

**Formulario "Editar cliente":**

- Mismos campos, con RUC **solo lectura** (el contrato de actualización no incluye RUC).
- Incluye switch "Activo" que envía `estado`.
- `PUT /clientes/{id}` y toast `success`.

**Criterios de aceptación:**

- RUC inválido bloquea el envío con mensaje claro.
- La búsqueda no dispara una petición por tecla.
- El fallback de SUNAT permite completar y guardar manualmente.

---

### 8.5 `OperacionesPage` — `/operaciones`

**Propósito:** gestionar empleados, cargos y flota.

**Acceso:** ADMIN y EMPLEADO (consulta); acciones de escritura solo ADMIN.

**Datos:**

- `GET /empleados`, `POST /empleados`, `POST /empleados/{id}/cargo`,
  `GET /empleados/{id}/historial`
- `GET /flota`, `POST /flota`
- `useCatalogos()` → `cargos`, `tipos_vehiculo`
- `GET /externo/dni/{dni}` (RENIEC)

**Estructura:** pestañas "Empleados" y "Flota", con contador por pestaña.

**Pestaña Empleados:**

- Tabla: nombres y apellidos, DNI, teléfono, cargo actual, estado y acciones.
- Acciones por fila: "Asignar cargo" (`POST .../cargo`) y "Historial"
  (`GET .../historial`, mostrado en modal con línea de tiempo).
- Botón "Registrar empleado" (solo ADMIN) abre formulario:

| Campo | Regla |
|---|---|
| Nombres | Obligatorio |
| Apellidos | Obligatorio |
| DNI | Obligatorio, 8 dígitos |
| Teléfono | Opcional, 6–15 caracteres |
| Cargo | Select obligatorio (catálogo `cargos`) |

- Botón "Consultar RENIEC" con DNI válido:
  - `manual: false` → autocompletar nombres/apellidos.
  - `manual: true` → toast `warning` + aviso ámbar + edición manual habilitada.
- Asignar cargo usa un modal con `Select` de cargos y toast `success`.

**Pestaña Flota:**

- Tabla: placa, tipo, capacidad kg, estado.
- Botón "Registrar vehículo" (solo ADMIN):

| Campo | Regla |
|---|---|
| Tipo de vehículo | Select obligatorio |
| Placa | Obligatoria; formato peruano válido; normalizada a mayúsculas |
| Capacidad | Numérica > 0 kg |

- Toast `success` al guardar y recarga de la lista.

**Criterios de aceptación:**

- Un `EMPLEADO` no ve botones de registro ni asignación.
- El DNI se valida antes de consultar RENIEC.
- La placa se guarda normalizada (`ABC-123`).
- El historial se muestra ordenado del más reciente al más antiguo.

---

### 8.6 `UsuariosPage` — `/usuarios`

**Propósito:** administrar las cuentas de acceso al sistema.

**Acceso:** solo ADMIN (`ProtectedRoute allowedRoles={["ADMIN"]}`).

**Datos:**

- `GET /usuarios`
- `GET /empleados` (para vincular)
- `POST /usuarios`
- `PATCH /usuarios/{id}/estado`
- `PATCH /usuarios/{id}/password`

**Listado:**

- Tabla: nombre completo, DNI, correo, rol (badge), estado (badge), fecha de creación y acciones.
- Buscador local por nombre/correo.
- Contador de activos/inactivos.

**Crear usuario (modal):**

| Campo | Regla |
|---|---|
| Empleado | Select obligatorio; empleados sin usuario o todos, según disponibilidad |
| Correo | Obligatorio y válido |
| Contraseña | Obligatoria, mínimo 8 caracteres |
| Confirmar contraseña | Obligatoria e idéntica |
| Rol | Select obligatorio: ADMIN o EMPLEADO |

- `POST /usuarios` con `{id_empleado, correo, password, rol}`.
- Toast `success` "Usuario registrado correctamente" y recarga.

**Activar/desactivar:**

- Botón `Power` por fila.
- Abre `ConfirmModal` variante `peligro`:
  "¿Desactivar a {nombre}? El usuario no podrá iniciar sesión."
- Confirmar → `PATCH .../estado` con el valor invertido → toast `success`.

**Cambiar contraseña:**

- Botón `KeyRound` por fila.
- `ConfirmModal` variante `advertencia` con campos "Nueva contraseña" y "Confirmar contraseña"
  (mínimo 8, deben coincidir).
- Confirmar → `PATCH .../password` → toast `success` "Contraseña actualizada correctamente".

**Criterios de aceptación:**

- Ningún acceso a la vista sin rol ADMIN.
- No se puede crear un usuario sin empleado vinculado.
- Las contraseñas nunca se muestran ni se registran en consola.
- Activar/desactivar y cambiar contraseña siempre pasan por `ConfirmModal`.

---

## 9. Reglas de validación global

Centralizadas en `src/utils/validaciones.js`:

| Función | Regla | Mensaje |
|---|---|---|
| `validarRuc` | `/^(10|20)\d{9}$/` | "El RUC debe tener 11 dígitos y comenzar con 10 o 20" |
| `validarDni` | `/^\d{8}$/` | "El DNI debe tener exactamente 8 dígitos" |
| `validarCorreo` | `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` | "Ingrese un correo válido" |
| `validarPlaca` | `ABC-123`, `AB-1234`, `A1B-234` | "Ingrese una placa válida (ej. ABC-123)" |
| `validarPeso` | número > 0, ≤ 2 decimales | "El peso debe ser mayor a 0" |
| `validarCapacidad` | número > 0 | "La capacidad debe ser mayor a 0" |
| `validarPassword` | longitud ≥ 8 | "La contraseña debe tener al menos 8 caracteres" |
| `validarRequerido` | `trim()` no vacío | "Este campo es obligatorio" |
| `validarTelefono` | 6–15 caracteres `[0-9+\s-]` | "Ingrese un teléfono válido" |

Reglas compuestas:

- `validarRecojo`: cliente, vehículo, centro, estado, fecha y hora obligatorios; ≥ 1 residuo;
  tipos únicos; pesos válidos; suma ≤ capacidad del vehículo.
- `validarUsuario`: empleado, correo, contraseña, confirmación y rol.
- `validarCliente`: razón social, RUC, correo y teléfono.
- `validarEmpleado`: nombres, apellidos, DNI, teléfono y cargo.
- `validarVehiculo`: tipo, placa y capacidad.

Presentación de errores:

- Inline, debajo del campo, texto `text-sm text-red-600`.
- Borde `border-red-500` en el campo inválido y `aria-invalid="true"`.
- El foco va al primer campo inválido al intentar enviar.
- El toast `error` complementa, nunca sustituye, el mensaje inline.

---

## 10. Diseño y UX

### 10.1 Identidad

- Nombre: EcoHuancayo S.A.C. — "Gestión de recojo de residuos".
- Tono: profesional, limpio, ecológico.
- Iconografía: Lucide React, trazo 2, tamaño 18–24 px.

### 10.2 Paleta

| Token | Uso | Valor |
|---|---|---|
| Primario | Botones, enlaces, foco | `emerald-600` (hover `emerald-700`) |
| Superficie primaria | Fondos suaves, badges | `emerald-50` / `emerald-100` |
| Texto principal | Títulos y cuerpo | `slate-900` |
| Texto secundario | Ayudas y metadatos | `slate-600` |
| Bordes | Separadores | `slate-200` |
| Fondo app | Lienzo | `slate-50` |
| Base | Tarjetas | `white` |
| Error | Toasts y validación | `red-600` / `red-50` |
| Advertencia | `manual: true` | `amber-500` / `amber-50` |
| Info | Avisos | `sky-600` / `sky-50` |

### 10.3 Layout

- `MainLayout`: sidebar fija de 260 px en `lg+`, colapsable a drawer con overlay en móvil;
  topbar con título de sección, nombre/rol del usuario y menú de sesión.
- Contenido máximo `max-w-7xl`, padding `p-4 md:p-6 lg:p-8`.
- Tarjetas `rounded-2xl bg-white shadow-sm ring-1 ring-slate-200`.
- Grid responsive: 1 columna en móvil, 2 en `md`, 3–4 en `xl` para KPIs.

### 10.4 Responsive (mobile-first)

| Breakpoint | Comportamiento |
|---|---|
| `< 640px` | Sidebar drawer, tablas como tarjetas, formularios a una columna, toasts a ancho completo |
| `≥ 640px` | Formularios a dos columnas cuando aplique |
| `≥ 768px` | Toasts arriba a la derecha, tablas híbridas |
| `≥ 1024px` | Sidebar fija, tablas completas, dashboard en grid amplio |

### 10.5 Movimiento y accesibilidad

- Transiciones `duration-200 ease-out` en hover, foco, apertura de modales y toasts.
- Skeletons con `animate-pulse`; respetar `prefers-reduced-motion`.
- Foco visible: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`.
- Contraste AA, `label` en todos los campos, `aria-label` en botones de icono.
- Modales y toasts navegables por teclado; `Escape` cierra modales.

---

## 11. Variables de entorno

| Variable | Ejemplo | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Base única de Axios |

- `Frontend/.env.example` documenta el placeholder; `.env` no se versiona.
- Prohibido hardcodear URLs en código, servicios o componentes.

---

## 12. CI/CD y despliegue

### 12.1 Render — Static Site

| Configuración | Valor |
|---|---|
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Environment | `VITE_API_URL=https://<backend>/api/v1` |
| Rewrite | `/*` → `/index.html` (200) |
| Node | 22 |

`public/_redirects`:

```text
/* /index.html 200
```

El dominio del Static Site debe figurar en `CORS_ORIGINS` del backend (gestión del equipo
backend; el frontend no lo modifica).

### 12.2 GitHub Actions

Archivo: `Frontend/.github/workflows/frontend-ci.yml` (equivale a
`.github/workflows/frontend-ci.yml` si `Frontend/` es la raíz del repositorio).

```yaml
name: Frontend CI

on:
  push:
    branches: [main]
    paths: ["Frontend/**"]
  pull_request:
    paths: ["Frontend/**"]

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: Frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: Frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - name: Deploy hook (solo main)
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
        env:
          RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

- El secreto `RENDER_DEPLOY_HOOK_URL` se configura en GitHub; nunca se versiona.
- El pipeline falla si lint o build fallan.

### 12.3 Local

```bash
npm install
npm run dev
npm run lint
npm run build
```

Backend local de referencia: `uv run uvicorn backend.main:app` — **sin `--reload`**.

---

## 13. QA y criterios de aceptación

### 13.1 Matriz funcional

| Caso | Resultado esperado |
|---|---|
| Login con credenciales válidas | Sesión guardada, toast `success`, redirección |
| Login con contraseña incorrecta | 401, error inline + toast `error` |
| Login de usuario inactivo | 403, mensaje "Usuario inactivo. Contacte al administrador" |
| Recargar con token válido | Sesión restaurada vía `/auth/me` |
| Token expirado | Logout automático y redirección a `/login` |
| Acceso de EMPLEADO a `/usuarios` | Redirección a `/dashboard` con toast `error` |
| Crear cliente con RUC inválido | Envío bloqueado, error inline |
| Consultar SUNAT con fallo | Toast `warning`, aviso ámbar, captura manual habilitada |
| Registrar recojo sin residuos | Envío bloqueado |
| Recojo cuyo peso supera la capacidad | Envío bloqueado y disponible negativo señalado |
| Actualizar estado de recojo | PATCH exitoso, toast `success`, lista recargada |
| Registrar vehículo con placa inválida | Envío bloqueado |
| Registrar empleado con DNI inválido | Envío bloqueado |
| Fallback RENIEC | Captura manual de nombres/apellidos |
| Desactivar usuario | `ConfirmModal` + PATCH + toast `success` |
| Cambiar contraseña | `ConfirmModal` con campos + PATCH + toast `success` |
| Clima no disponible | Tarjeta informativa, sin errores |
| Navegar a ruta inexistente | Redirección a `/dashboard` |
| Ver app en 360 px | Sin scroll horizontal; menú drawer funcional |

### 13.2 Criterios técnicos

- `npm run lint` sin errores.
- `npm run build` exitoso.
- 0 `fetch`, 0 `axios` en `pages/`, 0 URLs hardcodeadas.
- 0 `window.alert` / `window.confirm`.
- 4 tipos de toast funcionando con auto-cierre a 4 s, barra de progreso y cierre manual.
- `ConfirmModal` operativo en acciones críticas.
- `Backend/` sin cambios y ningún `.env` leído.

---

## 14. Decisiones y riesgos

| Decisión | Justificación |
|---|---|
| Sesión en `localStorage` | Persistencia entre pestañas; interceptor 401 centraliza el logout |
| Gráfico con CSS/SVG nativo | Respeta el stack fijo y evita dependencias |
| Toasts y modales propios | Control visual total, accesibilidad y cero librerías |
| Token en todas las peticiones | Consistencia aunque el backend no lo exija en algunos GET |
| RUC inmutable en edición | El contrato `ClienteUpdate` no incluye `ruc` |
| Recarga de listas tras mutaciones | Los POST/PUT/PATCH solo devuelven `{mensaje}` |

| Riesgo | Mitigación |
|---|---|
| Endpoints de escritura sin JWT en backend | El frontend exige sesión y aplica la matriz de roles; se reporta al equipo backend |
| Forma variable de los ítems de catálogo | Normalización defensiva `{id, nombre}` |
| Servicios externos caídos | Fallback `manual: true` con captura manual |
| Token expirado durante la sesión | Interceptor 401 + toast informativo + redirección |
| CORS mal configurado en producción | Validar `CORS_ORIGINS` con el equipo backend antes del despliegue |

---

## 15. Fuera de alcance

- Modificar el backend, su base de datos, sus variables de entorno o su CORS.
- Autenticación con refresh token, OAuth o SSO.
- Roles distintos de `ADMIN` y `EMPLEADO`.
- Edición o eliminación de recojos, empleados o vehículos (el contrato no lo expone).
- Exportación de reportes, impresión o envío de correos.
- Tests automatizados de UI en el pipeline (solo lint + build).
- Internacionalización; la interfaz se entrega en español.
