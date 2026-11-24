import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { onApiNotification } from "../api/axiosClient";
import ToastContainer from "../components/ui/ToastContainer";

const ToastContext = createContext(null);

const DURACION_POR_DEFECTO = 4000;
const MAX_TOASTS = 4;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const contadorRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((anteriores) => anteriores.filter((toast) => toast.id !== id));
  }, []);

  const agregar = useCallback((tipo, mensaje, opciones = {}) => {
    const texto = String(mensaje ?? "").trim();
    if (!texto) return null;

    const duracionSolicitada = Number(opciones.duracion);
    contadorRef.current += 1;

    const nuevoToast = {
      id: contadorRef.current,
      tipo,
      titulo: opciones.titulo ? String(opciones.titulo) : null,
      mensaje: texto,
      duracion:
        Number.isFinite(duracionSolicitada) && duracionSolicitada > 0
          ? duracionSolicitada
          : DURACION_POR_DEFECTO,
    };

    setToasts((anteriores) => {
      const siguientes = [...anteriores, nuevoToast];
      return siguientes.length > MAX_TOASTS
        ? siguientes.slice(siguientes.length - MAX_TOASTS)
        : siguientes;
    });

    return nuevoToast.id;
  }, []);

  const toast = useMemo(
    () => ({
      success: (mensaje, opciones) => agregar("success", mensaje, opciones),
      error: (mensaje, opciones) => agregar("error", mensaje, opciones),
      warning: (mensaje, opciones) => agregar("warning", mensaje, opciones),
      info: (mensaje, opciones) => agregar("info", mensaje, opciones),
    }),
    [agregar],
  );

  useEffect(
    () =>
      onApiNotification(({ tipo = "error", titulo = null, mensaje }) => {
        agregar(tipo, mensaje, { titulo });
      }),
    [agregar],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  }
  return contexto;
}
