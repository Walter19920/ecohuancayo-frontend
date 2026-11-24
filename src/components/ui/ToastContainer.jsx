import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleCheckBig,
  CircleX,
  Info,
  TriangleExclamationPoint,
  X,
} from "lucide-react";

const ESTILOS = {
  success: {
    Icono: CircleCheckBig,
    icono: "text-emerald-600",
    fondoIcono: "bg-emerald-50",
    barra: "bg-emerald-500",
    titulo: "Operación exitosa",
    role: "status",
    live: "polite",
  },
  error: {
    Icono: CircleX,
    icono: "text-red-600",
    fondoIcono: "bg-red-50",
    barra: "bg-red-500",
    titulo: "No se pudo completar",
    role: "alert",
    live: "assertive",
  },
  warning: {
    Icono: TriangleExclamationPoint,
    icono: "text-amber-600",
    fondoIcono: "bg-amber-50",
    barra: "bg-amber-500",
    titulo: "Atención",
    role: "alert",
    live: "assertive",
  },
  info: {
    Icono: Info,
    icono: "text-sky-600",
    fondoIcono: "bg-sky-50",
    barra: "bg-sky-500",
    titulo: "Información",
    role: "status",
    live: "polite",
  },
};

function ToastItem({ toast, onDismiss }) {
  const { id, tipo, titulo, mensaje, duracion } = toast;
  const estilo = ESTILOS[tipo] ?? ESTILOS.info;
  const Icono = estilo.Icono;

  const [saliendo, setSaliendo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const restanteRef = useRef(duracion);
  const inicioRef = useRef(0);
  const cerrandoRef = useRef(false);

  const cerrar = useCallback(() => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;
    setSaliendo(true);
    window.setTimeout(() => onDismiss(id), 150);
  }, [id, onDismiss]);

  useEffect(() => {
    if (pausado || cerrandoRef.current) return undefined;

    inicioRef.current = Date.now();
    const temporizador = window.setTimeout(
      cerrar,
      Math.max(restanteRef.current, 0),
    );

    return () => {
      window.clearTimeout(temporizador);
      const transcurrido = Date.now() - inicioRef.current;
      restanteRef.current = Math.max(restanteRef.current - transcurrido, 0);
    };
  }, [pausado, cerrar]);

  function reanudarAlSalirFoco(evento) {
    if (!evento.currentTarget.contains(evento.relatedTarget)) {
      setPausado(false);
    }
  }

  return (
    <article
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 sm:max-w-sm ${
        saliendo ? "animate-toast-out" : "animate-toast-in"
      }`}
      role={estilo.role}
      aria-live={estilo.live}
      aria-atomic="true"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={reanudarAlSalirFoco}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${estilo.barra}`}
        aria-hidden="true"
      />

      <div className="flex items-start gap-3 py-3 pr-3 pl-5">
        <span
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${estilo.fondoIcono}`}
        >
          <Icono className={`size-5 ${estilo.icono}`} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {titulo ?? estilo.titulo}
          </p>
          <p className="mt-0.5 text-sm leading-5 text-slate-600">{mensaje}</p>
        </div>

        <button
          type="button"
          onClick={cerrar}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label="Cerrar notificación"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-slate-100"
        aria-hidden="true"
      >
        <div
          className={`h-full origin-left animate-toast-progress ${estilo.barra} ${
            pausado ? "[animation-play-state:paused]" : ""
          }`}
          style={{ animationDuration: `${duracion}ms` }}
        />
      </div>
    </article>
  );
}

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-3 sm:inset-x-auto sm:top-6 sm:right-6 sm:items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
