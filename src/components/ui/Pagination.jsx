import { ChevronLeft, ChevronRight } from "lucide-react";
import { TAMANIOS_PAGINA } from "../../utils/paginacion";

/**
 * Paginación reutilizable para listados servidor.
 * Props: { pagina, totalPaginas, total, tamanioPagina, onPageChange, onTamanioChange }
 */
export default function Pagination({
  pagina = 1,
  totalPaginas = 0,
  total = 0,
  tamanioPagina = 5,
  onPageChange,
  onTamanioChange,
}) {
  if (total === 0) return null;

  const paginaActual = Math.max(1, Number(pagina) || 1);
  const ultimaPagina = Math.max(1, Number(totalPaginas) || 1);
  const puedeAnterior = paginaActual > 1;
  const puedeSiguiente = paginaActual < ultimaPagina;

  const botonBase =
    "inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700";

  return (
    <nav
      aria-label="Paginación de resultados"
      className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
        <label htmlFor="tamanio-pagina" className="font-medium">
          Mostrar
        </label>
        <select
          id="tamanio-pagina"
          value={Number(tamanioPagina)}
          onChange={(evento) => onTamanioChange?.(Number(evento.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {TAMANIOS_PAGINA.map((tamanio) => (
            <option key={tamanio} value={tamanio}>
              {tamanio}
            </option>
          ))}
        </select>
        <span>de {total.toLocaleString("es-PE")} registros</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange?.(paginaActual - 1)}
          disabled={!puedeAnterior}
          className={botonBase}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
          Página {paginaActual} de {ultimaPagina}
        </span>

        <button
          type="button"
          onClick={() => onPageChange?.(paginaActual + 1)}
          disabled={!puedeSiguiente}
          className={botonBase}
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
