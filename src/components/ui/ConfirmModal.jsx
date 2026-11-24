import { useEffect, useId, useRef } from "react";
import {
  LoaderCircle,
  ShieldExclamationPoint,
  TriangleExclamationPoint,
} from "lucide-react";

const VARIANTES = {
  peligro: {
    Icono: ShieldExclamationPoint,
    icono: "text-red-600",
    fondoIcono: "bg-red-50",
    boton:
      "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500",
  },
  advertencia: {
    Icono: TriangleExclamationPoint,
    icono: "text-amber-600",
    fondoIcono: "bg-amber-50",
    boton:
      "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400",
  },
};

export default function ConfirmModal({
  abierto = false,
  titulo = "Confirmar acción",
  mensaje,
  children,
  confirmarTexto = "Confirmar",
  cancelarTexto = "Cancelar",
  variante = "advertencia",
  cargando = false,
  onConfirmar,
  onCerrar,
}) {
  const tituloId = useId();
  const descripcionId = useId();
  const panelRef = useRef(null);
  const onCerrarRef = useRef(onCerrar);
  const cargandoRef = useRef(cargando);

  const varianteActual = VARIANTES[variante] ?? VARIANTES.advertencia;
  const Icono = varianteActual.Icono;

  useEffect(() => {
    onCerrarRef.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    cargandoRef.current = cargando;
  }, [cargando]);

  useEffect(() => {
    if (!abierto) return undefined;

    const focoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const enfocables = panel
      ? Array.from(
          panel.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        )
      : [];

    if (enfocables.length > 0) enfocables[0].focus();

    function manejarTeclado(evento) {
      if (evento.key === "Escape" && !cargandoRef.current) {
        evento.preventDefault();
        onCerrarRef.current?.();
        return;
      }

      if (evento.key !== "Tab" || enfocables.length === 0) return;

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", manejarTeclado);

    return () => {
      document.removeEventListener("keydown", manejarTeclado);
      document.body.style.overflow = overflowAnterior;
      if (focoAnterior instanceof HTMLElement) focoAnterior.focus();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm"
        onClick={() => {
          if (!cargando) onCerrar?.();
        }}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={mensaje ? descripcionId : undefined}
        className="relative w-full max-w-md animate-modal-in rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${varianteActual.fondoIcono}`}
          >
            <Icono
              className={`size-5 ${varianteActual.icono}`}
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0 flex-1">
            <h2
              id={tituloId}
              className="text-lg font-semibold text-slate-900"
            >
              {titulo}
            </h2>
            {mensaje ? (
              <p
                id={descripcionId}
                className="mt-1 text-sm leading-6 text-slate-600"
              >
                {mensaje}
              </p>
            ) : null}
          </div>
        </div>

        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelarTexto}
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${varianteActual.boton}`}
          >
            {cargando ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {cargando ? "Procesando…" : confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  );
}
