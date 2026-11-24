import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building,
  Car,
  CircleCheckBig,
  CircleX,
  Clock,
  CloudSun,
  Droplets,
  LoaderCircle,
  RefreshCw,
  Scale,
  Thermometer,
  TriangleExclamationPoint,
  Truck,
  Users,
  Wind,
} from "lucide-react";
import {
  obtenerIndicadores,
  obtenerKgPorTipoResiduo,
} from "../services/dashboardService";
import { consultarClimaHuancayo } from "../services/externoService";
import { listarUsuarios } from "../services/usuarioService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  formatearKg,
  formatearNumero,
  mensajeDeError,
} from "../utils/formatters";

const ZONA_CLIMA = "America/Lima";
const OFFSET_UTC_SEGUNDOS = 0;
const OFFSET_LIMA_SEGUNDOS = -5 * 60 * 60;
const FORMATEADOR_HORA_CLIMA = new Intl.DateTimeFormat("es-PE", {
  timeZone: ZONA_CLIMA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

function cadenaOffset(segundos) {
  const signo = segundos < 0 ? "-" : "+";
  const valor = Math.abs(Math.trunc(segundos));
  const horas = Math.floor(valor / 3600);
  const minutos = Math.floor((valor % 3600) / 60);
  return `${signo}${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function formatearHoraClima(valor, offsetUtc = null) {
  if (!valor) return null;

  const texto = String(valor).trim();
  const yaTieneOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto);
  const fecha = new Date(
    yaTieneOffset
      ? texto
      : `${texto}${cadenaOffset(offsetUtc ?? OFFSET_UTC_SEGUNDOS)}`,
  );

  if (Number.isNaN(fecha.getTime())) return texto;

  const partes = FORMATEADOR_HORA_CLIMA.formatToParts(fecha);
  const parte = (tipo) =>
    partes.find((elemento) => elemento.type === tipo)?.value ?? "";

  return [
    `${parte("day")}/${parte("month")}/${parte("year")}`,
    `${parte("hour")}:${parte("minute")}`,
    parte("dayPeriod"),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/[\u202f\u00a0]/g, " ");
}

const KPIS = [
  {
    clave: "total_recojos",
    etiqueta: "Total de recojos",
    Icono: Truck,
    icono: "text-emerald-700",
    fondo: "bg-emerald-100",
    tipo: "numero",
  },
  {
    clave: "total_kg_reciclados",
    etiqueta: "Kg reciclados",
    Icono: Scale,
    icono: "text-sky-700",
    fondo: "bg-sky-100",
    tipo: "kg",
  },
  {
    clave: "clientes_activos",
    etiqueta: "Clientes activos",
    Icono: Building,
    icono: "text-emerald-700",
    fondo: "bg-emerald-100",
    tipo: "numero",
  },
  {
    clave: "vehiculos_disponibles",
    etiqueta: "Vehículos disponibles",
    Icono: Car,
    icono: "text-slate-700",
    fondo: "bg-slate-100",
    tipo: "numero",
  },
  {
    clave: "recojos_completados",
    etiqueta: "Recojos completados",
    Icono: CircleCheckBig,
    icono: "text-emerald-700",
    fondo: "bg-emerald-100",
    tipo: "numero",
  },
  {
    clave: "recojos_pendientes",
    etiqueta: "Recojos pendientes",
    Icono: Clock,
    icono: "text-amber-700",
    fondo: "bg-amber-100",
    tipo: "numero",
  },
];

function aNumero(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function interpretarClima(respuesta) {
  const actual = respuesta?.current ?? respuesta?.actual ?? {};
  const unidades = respuesta?.current_units ?? {};

  const temperatura = aNumero(
    actual.temperature_2m ??
      respuesta?.temperatura ??
      respuesta?.temperature_2m,
  );
  const humedad = aNumero(
    actual.relative_humidity_2m ??
      respuesta?.humedad ??
      respuesta?.relative_humidity_2m,
  );
  const viento = aNumero(
    actual.wind_speed_10m ?? respuesta?.viento ?? respuesta?.wind_speed_10m,
  );

  const offsetCrudo = respuesta?.utc_offset_seconds;
  const offsetUtc =
    offsetCrudo === null || offsetCrudo === undefined
      ? respuesta?.timezone === ZONA_CLIMA
        ? OFFSET_LIMA_SEGUNDOS
        : null
      : Number(offsetCrudo);

  return {
    manual: respuesta?.manual === true,
    mensaje: respuesta?.mensaje ?? null,
    temperatura,
    humedad,
    viento,
    unidadTemperatura: unidades.temperature_2m ?? "°C",
    unidadHumedad: unidades.relative_humidity_2m ?? "%",
    unidadViento: unidades.wind_speed_10m ?? "km/h",
    actualizado: actual.time ?? respuesta?.time ?? null,
    offsetUtc: Number.isFinite(offsetUtc) ? offsetUtc : null,
  };
}

function KpiCard({ etiqueta, valor, Icono, icono, fondo, tipo }) {
  const numero = valor === null || valor === undefined ? null : Number(valor);
  const formateado =
    numero === null
      ? "—"
      : tipo === "kg"
        ? formatearKg(numero)
        : formatearNumero(numero);

  return (
    <article className="tarjeta-eco p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{etiqueta}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
            {formateado}
          </p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${fondo}`}
        >
          <Icono className={`size-5 ${icono}`} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function SkeletonKpis({ cantidad = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cantidad }).map((_, indice) => (
        <div
          key={indice}
          className="tarjeta-eco p-5"
        >
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function SkeletonBarras() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map((_, indice) => (
        <div key={indice}>
          <div className="mb-2 flex items-center justify-between">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-2.5 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function SkeletonClima() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, indice) => (
        <div
          key={indice}
          className="h-24 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
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
            No se pudieron cargar los indicadores
          </p>
          <p className="mt-0.5 text-sm text-red-700">{mensaje}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReintentar}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { usuario, esAdmin } = useAuth();
  const { toast } = useToast();

  const [indicadores, setIndicadores] = useState(null);
  const [kgTipos, setKgTipos] = useState([]);
  const [clima, setClima] = useState(null);
  const [usuariosTotales, setUsuariosTotales] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState("");
  const [fechaActual] = useState(() => new Date());
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cargar = useCallback(async () => {
    const peticiones = [
      obtenerIndicadores(),
      obtenerKgPorTipoResiduo(),
      consultarClimaHuancayo(),
    ];

    // /usuarios es exclusivo de ADMIN: SUPERVISOR nunca debe consultarlo.
    if (esAdmin) {
      peticiones.push(listarUsuarios({ pagina: 1, tamanio_pagina: 1 }));
    }

    const resultados = await Promise.allSettled(peticiones);

    if (!montadoRef.current) return;

    const [indicadoresRes, kgRes, climaRes, usuariosRes] = resultados;
    let mensajeError = "";

    if (indicadoresRes.status === "fulfilled") {
      setIndicadores(indicadoresRes.value ?? null);
    } else {
      setIndicadores(null);
      mensajeError = mensajeDeError(indicadoresRes.reason);
    }

    if (kgRes.status === "fulfilled") {
      setKgTipos(Array.isArray(kgRes.value) ? kgRes.value : []);
    } else {
      setKgTipos([]);
    }

    if (esAdmin) {
      setUsuariosTotales(
        usuariosRes?.status === "fulfilled"
          ? (usuariosRes.value?.total ?? 0)
          : null,
      );
    } else {
      setUsuariosTotales(null);
    }

    if (climaRes.status === "fulfilled") {
      const respuesta = climaRes.value ?? { manual: true };
      setClima(respuesta);

      if (respuesta.manual === true) {
        toast.warning(
          respuesta.mensaje ??
            "El servicio de clima no está disponible. Puede consultar los indicadores normalmente.",
          { titulo: "Clima no disponible" },
        );
      }
    } else {
      setClima({
        manual: true,
        mensaje:
          "El servicio de clima no está disponible. Puede consultar los indicadores normalmente.",
      });
      toast.warning(
        "El servicio de clima no está disponible. Puede consultar los indicadores normalmente.",
        { titulo: "Clima no disponible" },
      );
    }

    setError(mensajeError);
    setCargando(false);
    setRecargando(false);
  }, [esAdmin, toast]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  function recargar() {
    setRecargando(true);
    setError("");
    cargar();
  }

  const fechaFormateada = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(fechaActual),
    [fechaActual],
  );

  const nombre =
    usuario?.nombre_completo?.trim().split(/\s+/)[0] || "equipo";
  const climaInfo = useMemo(() => interpretarClima(clima), [clima]);
  const maxKg = useMemo(() => {
    const valores = kgTipos
      .map((item) => Number(item?.total_kg))
      .filter((valor) => Number.isFinite(valor) && valor > 0);
    return valores.length > 0 ? Math.max(...valores) : 0;
  }, [kgTipos]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Panel de control
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Hola, {nombre}
          </h1>
          <p className="mt-1 text-sm text-slate-600 first-letter:uppercase">
            {fechaFormateada}
          </p>
        </div>

        <button
          type="button"
          onClick={recargar}
          disabled={recargando}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

      {error ? <BloqueError mensaje={error} onReintentar={recargar} /> : null}

      <section aria-label="Indicadores principales">
        {cargando ? (
          <SkeletonKpis cantidad={esAdmin ? KPIS.length + 1 : KPIS.length} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {KPIS.map(({ clave, ...resto }) => (
              <KpiCard
                key={clave}
                valor={indicadores?.[clave]}
                {...resto}
              />
            ))}
            {esAdmin ? (
              <KpiCard
                clave="total_usuarios"
                etiqueta="Usuarios registrados"
                valor={usuariosTotales}
                Icono={Users}
                icono="text-sky-700"
                fondo="bg-sky-100"
                tipo="numero"
              />
            ) : null}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="titulo-kg-tipo"
          className="tarjeta-eco p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Scale className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="titulo-kg-tipo"
                className="text-base font-semibold text-slate-900"
              >
                Kg por tipo de residuo
              </h2>
              <p className="text-sm text-slate-500">
                Distribución acumulada de residuos reciclados.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {cargando ? (
              <SkeletonBarras />
            ) : kgTipos.length === 0 ? (
              <div className="rounded-xl bg-slate-50/80 px-4 py-10 text-center ring-1 ring-slate-200">
                <Scale
                  className="mx-auto size-8 text-slate-400"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Aún no hay kg registrados por tipo de residuo
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Los datos aparecerán cuando se registren recojos.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {kgTipos.map((item, indice) => {
                  const total = Number(item?.total_kg);
                  const porcentaje =
                    maxKg > 0 && Number.isFinite(total)
                      ? Math.min(
                          Math.max(
                            (total / maxKg) * 100,
                            total > 0 ? 2 : 0,
                          ),
                          100,
                        )
                      : 0;

                  return (
                    <li
                      key={`${item?.tipo_residuo ?? "tipo"}-${indice}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-slate-700">
                          {item?.tipo_residuo ?? "Sin tipo"}
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          {formatearKg(total)}
                        </span>
                      </div>
                      <div
                        className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={maxKg}
                        aria-valuenow={Number.isFinite(total) ? total : 0}
                        aria-label={`${item?.tipo_residuo ?? "Residuo"}: ${formatearKg(total)}`}
                      >
                        <div
                          className="h-full rounded-full bg-linear-to-r from-emerald-600 to-emerald-400 transition-[width] duration-500 ease-out"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section
          aria-labelledby="titulo-clima"
          className="tarjeta-eco p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <CloudSun className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="titulo-clima"
                className="text-base font-semibold text-slate-900"
              >
                Clima en Huancayo
              </h2>
              <p className="text-sm text-slate-500">
                Condiciones actuales de la ciudad.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {cargando ? (
              <SkeletonClima />
            ) : climaInfo.manual ? (
              <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <div className="flex items-start gap-3">
                  <TriangleExclamationPoint
                    className="mt-0.5 size-5 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-amber-800">No disponible</p>
                    <p className="mt-1 text-sm leading-5 text-amber-700">
                      {climaInfo.mensaje ??
                        "El servicio de clima no está disponible en este momento."}
                    </p>
                  </div>
                </div>
              </div>
            ) : climaInfo.temperatura === null &&
              climaInfo.humedad === null &&
              climaInfo.viento === null ? (
              <p className="text-sm text-slate-500">
                Sin datos de clima para mostrar.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50/80 p-3 text-center ring-1 ring-slate-200">
                  <Thermometer
                    className="mx-auto size-5 text-emerald-600"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Temperatura
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {climaInfo.temperatura === null
                      ? "—"
                      : `${formatearNumero(climaInfo.temperatura, {
                          maximumFractionDigits: 1,
                        })} ${climaInfo.unidadTemperatura}`}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 text-center ring-1 ring-slate-200">
                  <Droplets
                    className="mx-auto size-5 text-sky-600"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Humedad
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {climaInfo.humedad === null
                      ? "—"
                      : `${formatearNumero(climaInfo.humedad, {
                          maximumFractionDigits: 0,
                        })} ${climaInfo.unidadHumedad}`}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 text-center ring-1 ring-slate-200">
                  <Wind
                    className="mx-auto size-5 text-slate-600"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Viento
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {climaInfo.viento === null
                      ? "—"
                      : `${formatearNumero(climaInfo.viento, {
                          maximumFractionDigits: 1,
                        })} ${climaInfo.unidadViento}`}
                  </p>
                </div>
              </div>
            )}

            {!cargando && !climaInfo.manual && climaInfo.actualizado ? (
              <p className="mt-4 text-xs text-slate-500">
                Actualizado:{' '}
                {formatearHoraClima(climaInfo.actualizado, climaInfo.offsetUtc)}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
