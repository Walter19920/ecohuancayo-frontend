import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  onUnauthorized,
  saveSession,
} from "../api/axiosClient";
import {
  cambiarMiPassword as cambiarMiPasswordRequest,
  login as loginRequest,
  obtenerSesion,
} from "../services/authService";
import { rutaInicialPorRol } from "../utils/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [cargando, setCargando] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    let activo = true;

    async function revalidarSesion() {
      const tokenGuardado = getStoredToken();
      if (!tokenGuardado) return;

      try {
        const sesion = await obtenerSesion();
        if (!activo) return;

        const usuarioValidado = { ...sesion };
        saveSession({ token: tokenGuardado, usuario: usuarioValidado });
        setToken(tokenGuardado);
        setUsuario(usuarioValidado);
      } catch {
        if (!activo) return;
        clearSession();
        setToken(null);
        setUsuario(null);
      } finally {
        if (activo) setCargando(false);
      }
    }

    revalidarSesion();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const desuscribir = onUnauthorized(() => {
      clearSession();
      setToken(null);
      setUsuario(null);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  const login = useCallback(async (correo, password) => {
    const respuesta = await loginRequest(correo, password);
    const usuarioSesion = respuesta?.usuario ?? null;
    const tokenAcceso = respuesta?.access_token ?? null;

    if (!tokenAcceso || !usuarioSesion) {
      throw new Error("La respuesta de autenticación no es válida.");
    }

    saveSession({ token: tokenAcceso, usuario: usuarioSesion });
    setToken(tokenAcceso);
    setUsuario(usuarioSesion);
    setCargando(false);
    return usuarioSesion;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUsuario(null);
    setCargando(false);
  }, []);

  const cambiarMiPassword = useCallback(async (passwordActual, nuevaPassword) => {
    return cambiarMiPasswordRequest(passwordActual, nuevaPassword);
  }, []);

  const rol = String(usuario?.rol ?? "").trim().toUpperCase();

  const value = useMemo(
    () => ({
      usuario,
      token,
      cargando,
      autenticado: Boolean(token && usuario),
      rol,
      esAdmin: rol === "ADMIN",
      esSupervisor: rol === "SUPERVISOR",
      esOperador: rol === "OPERADOR",
      rutaInicio: rutaInicialPorRol(rol),
      login,
      logout,
      cambiarMiPassword,
    }),
    [usuario, token, cargando, rol, login, logout, cambiarMiPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  }
  return contexto;
}
