import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  atenderSolicitudContrasena,
  cambiarPasswordUsuario,
  listarSolicitudesContrasena,
} from "../services/usuarioService";

const NotificacionesContext = createContext(null);

const INTERVALO_CONSULTA_MS = 30000;

export function NotificacionesProvider({ children }) {
  const { rol } = useAuth();
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cambioGuardado, setCambioGuardado] = useState(null);

  const recargar = useCallback(async () => {
    try {
      setSolicitudes(await listarSolicitudesContrasena());
    } catch {
      // La campana es secundaria: un fallo no debe interrumpir la sesión.
      setSolicitudes([]);
    }
  }, []);

  useEffect(() => {
    if (rol !== "ADMIN") return undefined;

    let activo = true;

    async function cargar() {
      const datos = await listarSolicitudesContrasena();
      if (activo) setSolicitudes(datos);
    }

    cargar().catch(() => {
      if (activo) setSolicitudes([]);
    });

    const temporizador = setInterval(recargar, INTERVALO_CONSULTA_MS);
    return () => {
      activo = false;
      clearInterval(temporizador);
    };
  }, [recargar, rol]);

  const abrirCambio = useCallback((solicitud) => {
    setCambioGuardado(solicitud);
  }, []);

  const cerrarCambio = useCallback(() => {
    setCambioGuardado(null);
  }, []);

  const guardarClave = useCallback(
    async (solicitud, nuevaPassword) => {
      await cambiarPasswordUsuario(solicitud.id_usuario, nuevaPassword);
      await atenderSolicitudContrasena(solicitud.id_solicitud);
      await recargar();
      toast.success("Contraseña actualizada y solicitud atendida.");
    },
    [recargar, toast],
  );

  const value = useMemo(
    () => ({
      solicitudes: rol === "ADMIN" ? solicitudes : [],
      recargar,
      cambioSolicitud: rol === "ADMIN" ? cambioGuardado : null,
      abrirCambio,
      cerrarCambio,
      guardarClave,
    }),
    [
      rol,
      solicitudes,
      cambioGuardado,
      recargar,
      abrirCambio,
      cerrarCambio,
      guardarClave,
    ],
  );

  return (
    <NotificacionesContext.Provider value={value}>
      {children}
    </NotificacionesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificaciones() {
  const contexto = useContext(NotificacionesContext);
  if (!contexto) {
    throw new Error(
      "useNotificaciones debe usarse dentro de NotificacionesProvider",
    );
  }
  return contexto;
}
