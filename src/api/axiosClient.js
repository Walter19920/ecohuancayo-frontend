import axios from "axios";

export const TOKEN_KEY = "ecohuancayo_token";
export const USER_KEY = "ecohuancayo_usuario";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL && import.meta.env.DEV) {
  console.warn(
    "[axiosClient] VITE_API_URL no está definida. Copia Frontend/.env.example a Frontend/.env.",
  );
}

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const unauthorizedListeners = new Set();
const notificationListeners = new Set();

/** Suscribe un callback a los cierres de sesión por 401. Devuelve el unsubscribe. */
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

/**
 * Suscribe un callback a notificaciones generadas fuera de React
 * (por ejemplo, el interceptor 401). Devuelve el unsubscribe.
 */
export function onApiNotification(listener) {
  notificationListeners.add(listener);
  return () => notificationListeners.delete(listener);
}

function emitirNotificacion(payload) {
  notificationListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      /* una notificación no debe romper la petición */
    }
  });
}

function emitirCierreSesion() {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* el cierre de sesión es idempotente */
    }
  });
}

/** Token JWT almacenado en localStorage. */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Usuario serializado en localStorage. */
export function getStoredUser() {
  try {
    const crudo = localStorage.getItem(USER_KEY);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

/** Persiste token y usuario de la sesión. */
export function saveSession({ token, usuario }) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (usuario) localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Elimina cualquier rastro de la sesión. */
export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

/**
 * Extrae un mensaje legible de un error de Axios.
 * Prioriza `detail` del backend, luego `message` y finalmente un texto genérico.
 */
export function getApiError(error) {
  if (!error) return "Ocurrió un error inesperado.";

  const datos = error.response?.data;

  if (typeof datos === "string" && datos.trim()) return datos.trim();

  const detalle = datos?.detail;

  if (Array.isArray(detalle)) {
    const mensajes = detalle
      .map((item) => item?.msg ?? String(item ?? ""))
      .filter(Boolean);
    if (mensajes.length > 0) return mensajes.join(". ");
  }

  if (typeof detalle === "string" && detalle.trim()) return detalle.trim();

  if (error.code === "ERR_NETWORK" || !error.response) {
    return "No se pudo conectar con el servidor. Intente nuevamente.";
  }

  return error.message || "Ocurrió un error inesperado.";
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let ultimoManejo401 = 0;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const estado = error?.response?.status;
    const esLogin = String(error?.config?.url ?? "").includes("/auth/login");

    if (estado === 401 && !esLogin) {
      clearSession();

      const ahora = Date.now();
      if (ahora - ultimoManejo401 > 1500) {
        ultimoManejo401 = ahora;
        emitirCierreSesion();
        emitirNotificacion({
          tipo: "error",
          titulo: "Sesión finalizada",
          mensaje: getApiError(error),
        });
      }

      if (
        unauthorizedListeners.size === 0 &&
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
