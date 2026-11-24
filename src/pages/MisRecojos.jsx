import { useEffect, useState } from "react";
import {
  CircleX,
  Clock3,
  LoaderCircle,
  MapPin,
  Phone,
  RefreshCw,
  Truck,
} from "lucide-react";
import Pagination from "../components/ui/Pagination";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCatalogos } from "../hooks/useCatalogos";
import {
  actualizarEstadoRecojo,
  listarMisRecojos,
} from "../services/recojoService";
import {
  formatearFecha,
  formatearHora,
  formatearKg,
  mensajeDeError,
} from "../utils/formatters";

const ESTILOS_ESTADO = {
  programado: "bg-blue-100 text-blue-700 ring-blue-200",
  "en ruta": "bg-amber-100 text-amber-800 ring-amber-200",
  completado: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  cancelado: "bg-rose-100 text-rose-700 ring-rose-200",
};

const PASOS = {
  1: {
    id: 2,
    etiqueta: "Iniciar Ruta",
    clases: "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500",
  },
  2: {
    id: 3,
    etiqueta: "Completar",
    clases: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500",
  },
};

const IDS_SIN_ACCION = new Set([3, 4]);
const NOMBRES_SIN_ACCION = new Set(["COMPLETADO", "CANCELADO"]);

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, " ");
}

function esEstadoSinAccion(recojo) {
  if (!recojo) return false;
  const id = Number(recojo.id_estado_recojo);
  if (IDS_SIN_ACCION.has(id)) return true;
  return NOMBRES_SIN_ACCION.has(normalizarTexto(recojo.estado_recojo));
}

function EstadoBadge({ estado }) {
  const clave = normalizarTexto(estado).toLowerCase();
  const estilo = ESTILOS_ESTADO[clave] ?? "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${estilo}`}
    >
      {estado ?? "—"}
    </span>
  );
}

function BloqueError({ mensaje, onReintentar }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <CircleX
          className="mt-0.5 size-5 shrink-0 text-red-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-red-800">
            No se pudieron cargar tus recojos
          </p>
          <p className="mt-0.5 text-sm text-red-700">{mensaje}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReintentar}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}

function SkeletonLista() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, indice) => (
        <div
          key={indice}
          className="tarjeta-eco p-5"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, posicion) => (
              <div
                key={posicion}
                className="h-3 animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CampoDetalle({ etiqueta, valor, icono: Icono }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {etiqueta}
      </dt>
      <dd className="mt-1 flex items-start gap-1.5 text-sm text-slate-800">
        {Icono ? (
          <Icono className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
        ) : null}
        <span className="min-w-0 break-words">{valor ?? "—"}</span>
      </dd>
    </div>
  );
}

export default function MisRecojosPage() {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const { catalogos } = useCatalogos();

  const [recojos, setRecojos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tamanioPagina, setTamanioPagina] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [actualizando, setActualizando] = useState(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const respuesta = await listarMisRecojos({
          id_estado: filtroEstado || null,
          pagina,
          tamanio_pagina: tamanioPagina,
        });
        if (!activo) return;
        setRecojos(respuesta.items);
        setTotal(respuesta.total);
        setTotalPaginas(respuesta.total_paginas);
        setError("");
      } catch (err) {
        if (!activo) return;
        setError(mensajeDeError(err));
      } finally {
        if (activo) {
          setCargando(false);
          setRecargando(false);
        }
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [filtroEstado, pagina, tamanioPagina, recarga]);

  function recargar() {
    setRecargando(true);
    setRecarga((valor) => valor + 1);
  }

  function cambiarFiltro(valor) {
    if (valor === filtroEstado) return;
    setCargando(true);
    setFiltroEstado(valor);
    setPagina(1);
  }

  function siguientePaso(recojo) {
    if (!recojo || esEstadoSinAccion(recojo)) return null;

    const id = Number(recojo.id_estado_recojo);
    if (id === 1) return PASOS[1];
    if (id === 2) return PASOS[2];

    const nombre = normalizarTexto(recojo.estado_recojo);
    if (nombre === "PROGRAMADO") return PASOS[1];
    if (nombre === "EN RUTA") return PASOS[2];

    return null;
  }

  async function avanzarEstado(recojo) {
    const paso = siguientePaso(recojo);
    if (!paso || actualizando !== null) return;

    setActualizando(recojo.id_recojo);
    try {
      await actualizarEstadoRecojo(recojo.id_recojo, paso.id);
      toast.success(`Recojo #${recojo.id_recojo} actualizado correctamente.`);
      recargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setActualizando(null);
    }
  }

  const nombreOperador =
    usuario?.nombre_completo ?? usuario?.correo ?? "Operador";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Panel del operador</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Mis recojos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Hola, {nombreOperador}. Gestiona los recojos asignados a tu persona.
          </p>
        </div>
        <button
          type="button"
          onClick={recargar}
          disabled={recargando}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {recargando ? (
            <LoaderCircle
              className="size-4 animate-spin text-emerald-600"
              aria-hidden="true"
            />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {recargando ? "Actualizando…" : "Actualizar"}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="tarjeta-eco p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Asignados
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {total.toLocaleString("es-PE")}
          </p>
        </div>
        <div className="tarjeta-eco p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Programados
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-700">
            {
              recojos.filter(
                (recojo) =>
                  normalizarTexto(recojo.estado_recojo) === "PROGRAMADO",
              ).length
            }
          </p>
        </div>
        <div className="tarjeta-eco p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            En ruta
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {
              recojos.filter(
                (recojo) => normalizarTexto(recojo.estado_recojo) === "EN RUTA",
              ).length
            }
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 tarjeta-eco p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="filtro-estado" className="text-sm font-medium text-slate-700">
            Estado
          </label>
          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(evento) => cambiarFiltro(evento.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <option value="">Todos los estados</option>
            {catalogos.estados_recojo.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500">
          {total.toLocaleString("es-PE")}{" "}
          {total === 1 ? "recojo asignado" : "recojos asignados"}
        </p>
      </div>

      {error ? <BloqueError mensaje={error} onReintentar={recargar} /> : null}

      {cargando ? (
        <SkeletonLista />
      ) : recojos.length === 0 && !error ? (
        <div className="tarjeta-eco px-4 py-12 text-center">
          <Truck className="mx-auto size-10 text-slate-400" aria-hidden="true" />
          <p className="mt-4 text-base font-semibold text-slate-900">
            No tienes recojos asignados
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {filtroEstado
              ? "No hay recojos con el estado seleccionado. Prueba con otro filtro."
              : "Cuando el supervisor te asigne un recojo aparecerá aquí."}
          </p>
        </div>
      ) : recojos.length > 0 ? (
        <>
          <div className="hidden overflow-hidden tarjeta-eco lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">Recojo</th>
                    <th scope="col" className="px-4 py-3">Cliente</th>
                    <th scope="col" className="px-4 py-3">Entrega</th>
                    <th scope="col" className="px-4 py-3">Fecha y hora</th>
                    <th scope="col" className="px-4 py-3">Total</th>
                    <th scope="col" className="px-4 py-3">Estado</th>
                    <th scope="col" className="px-4 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recojos.map((recojo) => {
                    const paso = siguientePaso(recojo);
                    return (
                      <tr
                        key={recojo.id_recojo}
                        className="transition-colors duration-200 even:bg-slate-50/70 hover:bg-slate-100/80"
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-semibold text-slate-900">
                            #{recojo.id_recojo}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {recojo.vehiculo_placa ?? "—"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {recojo.rol_en_recojo ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {recojo.cliente ?? "—"}
                          </p>
                          <p className="font-mono text-xs text-slate-500">
                            RUC {recojo.ruc ?? "—"}
                          </p>
                          <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                            <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            {recojo.direccion_cliente ?? "—"}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="size-3 shrink-0" aria-hidden="true" />
                            {recojo.telefono_cliente ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800">
                            {recojo.centro_reciclaje ?? "—"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {recojo.distrito_destino ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="flex items-center gap-1 text-slate-800">
                            <Clock3 className="size-3.5 text-emerald-600" aria-hidden="true" />
                            {formatearFecha(recojo.fecha_recojo)}
                          </p>
                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {formatearHora(recojo.hora_recojo)}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatearKg(recojo.total_kg)}
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={recojo.estado_recojo} />
                        </td>
                        <td className="px-4 py-3">
                          {paso ? (
                            <button
                              type="button"
                              onClick={() => avanzarEstado(recojo)}
                              disabled={actualizando !== null}
                              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${paso.clases}`}
                            >
                              {actualizando === recojo.id_recojo ? (
                                <LoaderCircle
                                  className="size-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : null}
                              {paso.etiqueta}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {esEstadoSinAccion(recojo) ? "Sin acciones" : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {recojos.map((recojo) => {
              const paso = siguientePaso(recojo);
              return (
                <article
                  key={recojo.id_recojo}
                  className="tarjeta-eco p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-900">
                        Recojo #{recojo.id_recojo}
                      </p>
                      <p className="mt-0.5 text-base font-semibold text-slate-900">
                        {recojo.cliente ?? "—"}
                      </p>
                    </div>
                    <EstadoBadge estado={recojo.estado_recojo} />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <CampoDetalle etiqueta="RUC" valor={recojo.ruc} />
                    <CampoDetalle etiqueta="Vehículo" valor={recojo.vehiculo_placa} />
                    <CampoDetalle
                      etiqueta="Dirección"
                      valor={recojo.direccion_cliente}
                      icono={MapPin}
                    />
                    <CampoDetalle
                      etiqueta="Teléfono"
                      valor={recojo.telefono_cliente}
                      icono={Phone}
                    />
                    <CampoDetalle etiqueta="Centro" valor={recojo.centro_reciclaje} />
                    <CampoDetalle etiqueta="Distrito" valor={recojo.distrito_destino} />
                    <CampoDetalle etiqueta="Rol" valor={recojo.rol_en_recojo} />
                    <CampoDetalle etiqueta="Total" valor={formatearKg(recojo.total_kg)} />
                    <CampoDetalle
                      etiqueta="Fecha"
                      valor={formatearFecha(recojo.fecha_recojo)}
                      icono={Clock3}
                    />
                    <CampoDetalle etiqueta="Hora" valor={formatearHora(recojo.hora_recojo)} />
                  </dl>

                  {paso ? (
                    <button
                      type="button"
                      onClick={() => avanzarEstado(recojo)}
                      disabled={actualizando !== null}
                      className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${paso.clases}`}
                    >
                      {actualizando === recojo.id_recojo ? (
                        <LoaderCircle
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : null}
                      {paso.etiqueta}
                    </button>
                  ) : (
                    <p className="mt-5 text-xs text-slate-400">
                      {esEstadoSinAccion(recojo) ? "Sin acciones" : "—"}
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          <div className="overflow-hidden tarjeta-eco">
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              total={total}
              tamanioPagina={tamanioPagina}
              onPageChange={setPagina}
              onTamanioChange={(valor) => {
                setTamanioPagina(valor);
                setPagina(1);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
