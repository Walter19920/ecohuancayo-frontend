import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleX,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Trash2,
  TriangleExclamationPoint,
  Truck,
  Users,
  X,
} from "lucide-react";
import {
  actualizarEstadoRecojo,
  listarRecojos,
  registrarRecojo,
} from "../services/recojoService";
import { listarClientes } from "../services/clienteService";
import { listarVehiculos } from "../services/flotaService";
import { listarEmpleados } from "../services/empleadoService";
import { useCatalogos } from "../hooks/useCatalogos";
import { useToast } from "../context/ToastContext";
import {
  formatearFecha,
  formatearHora,
  formatearKg,
  mensajeDeError,
} from "../utils/formatters";
import { sumarPesos, validarRecojo } from "../utils/validaciones";
import { PAGINA_AUXILIAR } from "../utils/paginacion";
import Pagination from "../components/ui/Pagination";

const ESTILOS_ESTADO = {
  programado: "bg-blue-100 text-blue-700 ring-blue-200",
  "en ruta": "bg-amber-100 text-amber-800 ring-amber-200",
  completado: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  cancelado: "bg-rose-100 text-rose-700 ring-rose-200",
};

function EstadoBadge({ estado }) {
  const clave = String(estado ?? "").toLowerCase();
  const estilo =
    ESTILOS_ESTADO[clave] ?? "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${estilo}`}
    >
      {estado ?? "—"}
    </span>
  );
}

function claseInput(tieneError) {
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 ${
    tieneError
      ? "border-red-400 focus-visible:ring-red-400"
      : "border-slate-200 focus-visible:ring-emerald-500"
  }`;
}

function Campo({ etiqueta, htmlFor, error, requerido = false, ayuda, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {etiqueta}
        {requerido ? <span className="ml-0.5 text-red-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : ayuda ? (
        <p className="mt-1 text-xs text-slate-500">{ayuda}</p>
      ) : null}
    </div>
  );
}

function SelectorEstado({
  recojo,
  estados,
  valor,
  onChange,
  onConfirmar,
  actualizando,
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`estado-recojo-${recojo.id_recojo}`} className="sr-only">
        Nuevo estado del recojo
      </label>
      <select
        id={`estado-recojo-${recojo.id_recojo}`}
        value={valor ?? ""}
        onChange={(evento) => onChange(recojo.id_recojo, evento.target.value)}
        disabled={actualizando}
        className="min-w-0 max-w-[9.5rem] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">Estado</option>
        {estados.map((estado) => (
          <option key={estado.id} value={estado.id}>
            {estado.nombre}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onConfirmar(recojo.id_recojo)}
        disabled={actualizando || !valor}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Confirmar nuevo estado de ${recojo.cliente ?? "recojo"}`}
      >
        {actualizando ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function SkeletonLista() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, indice) => (
        <div
          key={indice}
          className="tarjeta-eco p-4"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, posicion) => (
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
            No se pudieron cargar los recojos
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

function fechaHoy() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function horaAhora() {
  const fecha = new Date();
  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

function crearRecojoVacio() {
  return {
    id_cliente: "",
    id_vehiculo: "",
    id_centro_reciclaje: "",
    id_estado_recojo: "",
    fecha_recojo: "",
    hora_recojo: "",
    residuos: [{ id_tipo_residuo: "", peso_kg: "" }],
    empleados: [],
  };
}

function crearRecojoNuevo() {
  return {
    ...crearRecojoVacio(),
    fecha_recojo: fechaHoy(),
    hora_recojo: horaAhora(),
  };
}

function indexarEstados(recojos) {
  return recojos.reduce((acumulado, recojo) => {
    acumulado[recojo.id_recojo] = recojo.id_estado_recojo ?? "";
    return acumulado;
  }, {});
}

export default function RecojosPage() {
  const {
    catalogos,
    cargando: cargandoCatalogos,
    error: errorCatalogos,
    recargar: recargarCatalogos,
  } = useCatalogos();
  const { toast } = useToast();

  const [recojos, setRecojos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [tamanioPagina, setTamanioPagina] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargandoAuxiliares, setCargandoAuxiliares] = useState(true);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(crearRecojoVacio);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const [estadosPorRecojo, setEstadosPorRecojo] = useState({});
  const [actualizandoId, setActualizandoId] = useState(null);

  const formRef = useRef(null);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
      setPagina(1);
    }, 400);
    return () => window.clearTimeout(temporizador);
  }, [busqueda]);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const respuesta = await listarRecojos({
          id_estado: filtroEstado || null,
          busqueda: busquedaDebounced,
          pagina,
          tamanio_pagina: tamanioPagina,
        });
        if (!activo) return;
        setRecojos(respuesta.items);
        setTotal(respuesta.total);
        setTotalPaginas(respuesta.total_paginas);
        setEstadosPorRecojo(indexarEstados(respuesta.items));
        setError("");
      } catch (err) {
        if (activo) setError(mensajeDeError(err));
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
  }, [filtroEstado, busquedaDebounced, pagina, tamanioPagina, recarga]);

  useEffect(() => {
    let activo = true;

    async function cargarAuxiliares() {
      const resultados = await Promise.allSettled([
        listarClientes(PAGINA_AUXILIAR),
        listarVehiculos(PAGINA_AUXILIAR),
        listarEmpleados(PAGINA_AUXILIAR),
      ]);

      if (!activo) return;

      const [clientesRes, vehiculosRes, empleadosRes] = resultados;

      if (clientesRes.status === "fulfilled") {
        setClientes(clientesRes.value.items);
      }
      if (vehiculosRes.status === "fulfilled") {
        setVehiculos(vehiculosRes.value.items);
      }
      if (empleadosRes.status === "fulfilled") {
        setEmpleados(empleadosRes.value.items);
      }
      if (resultados.some((resultado) => resultado.status === "rejected")) {
        toast.error(
          "No se pudieron cargar algunos datos auxiliares del formulario.",
        );
      }

      setCargandoAuxiliares(false);
    }

    cargarAuxiliares();

    return () => {
      activo = false;
    };
  }, [toast]);

  useEffect(() => {
    if (mostrarFormulario && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [mostrarFormulario]);

  const clientesActivos = useMemo(
    () => clientes.filter((cliente) => cliente.estado !== false),
    [clientes],
  );
  const vehiculosActivos = useMemo(
    () => vehiculos.filter((vehiculo) => vehiculo.estado !== false),
    [vehiculos],
  );
  const empleadosActivos = useMemo(
    () => empleados.filter((empleado) => empleado.estado !== false),
    [empleados],
  );

  const vehiculoSeleccionado = useMemo(
    () =>
      vehiculosActivos.find(
        (vehiculo) =>
          String(vehiculo.id_vehiculo) === String(formulario.id_vehiculo),
      ) ?? null,
    [vehiculosActivos, formulario.id_vehiculo],
  );

  const capacidad = Number(vehiculoSeleccionado?.capacidad_kg) || 0;
  const totalKg = sumarPesos(formulario.residuos);
  const disponible = capacidad > 0 ? capacidad - totalKg : null;
  const excedeCapacidad = capacidad > 0 && totalKg > capacidad;
  const estados = catalogos.estados_recojo;

  function limpiarError(campo) {
    setErrores((anteriores) => {
      if (!anteriores[campo]) return anteriores;
      const siguientes = { ...anteriores };
      delete siguientes[campo];
      return siguientes;
    });
  }

  function abrirFormulario() {
    setFormulario(crearRecojoNuevo());
    setErrores({});
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) return;
    setMostrarFormulario(false);
    setErrores({});
  }

  function actualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anteriores) => {
      const siguientes = { ...anteriores };
      delete siguientes[campo];
      if (campo === "id_vehiculo") delete siguientes.capacidad;
      return siguientes;
    });
  }

  function actualizarResiduo(indice, campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      residuos: anterior.residuos.map((residuo, posicion) =>
        posicion === indice ? { ...residuo, [campo]: valor } : residuo,
      ),
    }));

    setErrores((anteriores) => {
      const siguientes = { ...anteriores };
      delete siguientes.residuos;
      delete siguientes.capacidad;

      if (siguientes.residuosFilas) {
        const filas = { ...siguientes.residuosFilas };
        delete filas[indice];
        if (Object.keys(filas).length === 0) {
          delete siguientes.residuosFilas;
        } else {
          siguientes.residuosFilas = filas;
        }
      }

      return siguientes;
    });
  }

  function agregarResiduo() {
    setFormulario((anterior) => ({
      ...anterior,
      residuos: [
        ...anterior.residuos,
        { id_tipo_residuo: "", peso_kg: "" },
      ],
    }));
  }

  function quitarResiduo(indice) {
    setFormulario((anterior) => ({
      ...anterior,
      residuos: anterior.residuos.filter(
        (_, posicion) => posicion !== indice,
      ),
    }));

    setErrores((anteriores) => {
      const siguientes = { ...anteriores };
      delete siguientes.residuos;
      delete siguientes.capacidad;
      delete siguientes.residuosFilas;
      return siguientes;
    });
  }

  function alternarEmpleado(idEmpleado) {
    setFormulario((anterior) => {
      const existe = anterior.empleados.includes(idEmpleado);
      return {
        ...anterior,
        empleados: existe
          ? anterior.empleados.filter((id) => id !== idEmpleado)
          : [...anterior.empleados, idEmpleado],
      };
    });
    limpiarError("empleados");
  }

  function cambiarFiltro(valor) {
    if (valor === filtroEstado) return;
    setCargando(true);
    setFiltroEstado(valor);
    setPagina(1);
  }

  function recargar() {
    setRecargando(true);
    setRecarga((valor) => valor + 1);
  }

  function cambiarEstadoSeleccionado(idRecojo, valor) {
    setEstadosPorRecojo((anteriores) => ({
      ...anteriores,
      [idRecojo]: valor,
    }));
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const resultado = validarRecojo(
      formulario,
      capacidad > 0 ? capacidad : null,
    );

    if (!resultado.valido) {
      setErrores(resultado.errores);
      toast.error("Revisa los datos del formulario de recojo.");
      return;
    }

    setGuardando(true);

    try {
      await registrarRecojo(formulario);
      toast.success("Recojo registrado correctamente.");
      setMostrarFormulario(false);
      setFormulario(crearRecojoVacio());
      setErrores({});
      setRecargando(true);
      setRecarga((valor) => valor + 1);
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEstado(idRecojo) {
    const nuevoEstado = Number(estadosPorRecojo[idRecojo]);

    if (!nuevoEstado) {
      toast.error("Selecciona un estado para el recojo.");
      return;
    }

    const recojo = recojos.find((item) => item.id_recojo === idRecojo);
    if (recojo && Number(recojo.id_estado_recojo) === nuevoEstado) {
      toast.info("El recojo ya tiene el estado seleccionado.");
      return;
    }

    setActualizandoId(idRecojo);

    try {
      await actualizarEstadoRecojo(idRecojo, nuevoEstado);
      toast.success("Estado del recojo actualizado correctamente.");
      setRecargando(true);
      setRecarga((valor) => valor + 1);
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Operación</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Recojos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Registra, filtra y actualiza el estado de los recojos de residuos.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
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

          <button
            type="button"
            onClick={abrirFormulario}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo recojo
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 tarjeta-eco p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-slate-400" aria-hidden="true" />
          <label
            htmlFor="filtro-estado-recojo"
            className="text-sm font-medium text-slate-700"
          >
            Filtrar por estado
          </label>
          <select
            id="filtro-estado-recojo"
            value={filtroEstado}
            onChange={(evento) => cambiarFiltro(evento.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <option value="">Todos</option>
            {estados.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="buscar-recojo" className="sr-only">
            Buscar recojo
          </label>
          <input
            id="buscar-recojo"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por cliente o RUC…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-9 pl-9 text-sm text-slate-900 shadow-sm transition-colors duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
          {busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <p className="text-sm text-slate-500">
          {total.toLocaleString("es-PE")}{" "}
          {total === 1 ? "recojo encontrado" : "recojos encontrados"}
        </p>
      </div>

      {mostrarFormulario ? (
        <section
          ref={formRef}
          aria-labelledby="titulo-nuevo-recojo"
          className="scroll-mt-24 tarjeta-eco p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="titulo-nuevo-recojo"
                className="text-lg font-semibold text-slate-900"
              >
                Nuevo recojo
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Completa los datos y verifica que el peso no supere la
                capacidad del vehículo.
              </p>
            </div>
            <button
              type="button"
              onClick={cerrarFormulario}
              disabled={guardando}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Cerrar formulario de nuevo recojo"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {errorCatalogos ? (
            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <TriangleExclamationPoint
                  className="mt-0.5 size-4 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
                <p className="text-sm text-amber-800">
                  No se pudieron cargar los catálogos: {errorCatalogos}
                </p>
              </div>
              <button
                type="button"
                onClick={recargarCatalogos}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors duration-200 hover:bg-amber-100"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {cargandoAuxiliares ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <LoaderCircle
                className="size-3.5 animate-spin text-emerald-600"
                aria-hidden="true"
              />
              Cargando clientes, vehículos y empleados…
            </p>
          ) : null}

          <form onSubmit={manejarEnvio} noValidate className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Cliente"
                htmlFor="recojo-cliente"
                error={errores.id_cliente}
                requerido
              >
                <select
                  id="recojo-cliente"
                  value={formulario.id_cliente}
                  onChange={(evento) =>
                    actualizarCampo("id_cliente", evento.target.value)
                  }
                  disabled={cargandoAuxiliares}
                  className={claseInput(Boolean(errores.id_cliente))}
                  aria-invalid={Boolean(errores.id_cliente)}
                >
                  <option value="">Selecciona un cliente</option>
                  {clientesActivos.map((cliente) => (
                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                      {cliente.razon_social} — {cliente.ruc ?? "sin RUC"}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                etiqueta="Vehículo"
                htmlFor="recojo-vehiculo"
                error={errores.id_vehiculo}
                requerido
                ayuda={
                  vehiculoSeleccionado
                    ? `Capacidad: ${formatearKg(capacidad)}`
                    : "Solo se muestran vehículos activos."
                }
              >
                <select
                  id="recojo-vehiculo"
                  value={formulario.id_vehiculo}
                  onChange={(evento) =>
                    actualizarCampo("id_vehiculo", evento.target.value)
                  }
                  disabled={cargandoAuxiliares}
                  className={claseInput(Boolean(errores.id_vehiculo))}
                  aria-invalid={Boolean(errores.id_vehiculo)}
                >
                  <option value="">Selecciona un vehículo</option>
                  {vehiculosActivos.map((vehiculo) => (
                    <option
                      key={vehiculo.id_vehiculo}
                      value={vehiculo.id_vehiculo}
                    >
                      {vehiculo.placa} — {formatearKg(vehiculo.capacidad_kg)}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                etiqueta="Centro de reciclaje"
                htmlFor="recojo-centro"
                error={errores.id_centro_reciclaje}
                requerido
              >
                <select
                  id="recojo-centro"
                  value={formulario.id_centro_reciclaje}
                  onChange={(evento) =>
                    actualizarCampo("id_centro_reciclaje", evento.target.value)
                  }
                  disabled={cargandoCatalogos}
                  className={claseInput(
                    Boolean(errores.id_centro_reciclaje),
                  )}
                  aria-invalid={Boolean(errores.id_centro_reciclaje)}
                >
                  <option value="">Selecciona un centro</option>
                  {catalogos.centros_reciclaje.map((centro) => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                etiqueta="Estado inicial"
                htmlFor="recojo-estado"
                error={errores.id_estado_recojo}
                requerido
              >
                <select
                  id="recojo-estado"
                  value={formulario.id_estado_recojo}
                  onChange={(evento) =>
                    actualizarCampo("id_estado_recojo", evento.target.value)
                  }
                  disabled={cargandoCatalogos}
                  className={claseInput(Boolean(errores.id_estado_recojo))}
                  aria-invalid={Boolean(errores.id_estado_recojo)}
                >
                  <option value="">Selecciona un estado</option>
                  {estados.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                etiqueta="Fecha de recojo"
                htmlFor="recojo-fecha"
                error={errores.fecha_recojo}
                requerido
              >
                <input
                  id="recojo-fecha"
                  type="date"
                  value={formulario.fecha_recojo}
                  onChange={(evento) =>
                    actualizarCampo("fecha_recojo", evento.target.value)
                  }
                  className={claseInput(Boolean(errores.fecha_recojo))}
                  aria-invalid={Boolean(errores.fecha_recojo)}
                />
              </Campo>

              <Campo
                etiqueta="Hora de recojo"
                htmlFor="recojo-hora"
                error={errores.hora_recojo}
                requerido
              >
                <input
                  id="recojo-hora"
                  type="time"
                  value={formulario.hora_recojo}
                  onChange={(evento) =>
                    actualizarCampo("hora_recojo", evento.target.value)
                  }
                  className={claseInput(Boolean(errores.hora_recojo))}
                  aria-invalid={Boolean(errores.hora_recojo)}
                />
              </Campo>
            </div>

            <section
              aria-labelledby="titulo-residuos-recojo"
              className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3
                  id="titulo-residuos-recojo"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                >
                  <Scale className="size-4 text-emerald-600" aria-hidden="true" />
                  Residuos del recojo
                </h3>
                <button
                  type="button"
                  onClick={agregarResiduo}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Agregar residuo
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {formulario.residuos.map((residuo, indice) => {
                  const errorFila = errores.residuosFilas?.[indice] ?? {};

                  return (
                    <div
                      key={indice}
                      className="grid gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-start"
                    >
                      <div>
                        <label
                          htmlFor={`residuo-tipo-${indice}`}
                          className="sr-only"
                        >
                          Tipo de residuo {indice + 1}
                        </label>
                        <select
                          id={`residuo-tipo-${indice}`}
                          value={residuo.id_tipo_residuo}
                          onChange={(evento) =>
                            actualizarResiduo(
                              indice,
                              "id_tipo_residuo",
                              evento.target.value,
                            )
                          }
                          disabled={cargandoCatalogos}
                          className={claseInput(
                            Boolean(errorFila.id_tipo_residuo),
                          )}
                          aria-invalid={Boolean(errorFila.id_tipo_residuo)}
                        >
                          <option value="">Tipo de residuo</option>
                          {catalogos.tipos_residuo.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                              {tipo.nombre}
                            </option>
                          ))}
                        </select>
                        {errorFila.id_tipo_residuo ? (
                          <p className="mt-1 text-sm text-red-600">
                            {errorFila.id_tipo_residuo}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label
                          htmlFor={`residuo-peso-${indice}`}
                          className="sr-only"
                        >
                          Peso en kg del residuo {indice + 1}
                        </label>
                        <input
                          id={`residuo-peso-${indice}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Peso (kg)"
                          value={residuo.peso_kg}
                          onChange={(evento) =>
                            actualizarResiduo(
                              indice,
                              "peso_kg",
                              evento.target.value,
                            )
                          }
                          className={claseInput(Boolean(errorFila.peso_kg))}
                          aria-invalid={Boolean(errorFila.peso_kg)}
                        />
                        {errorFila.peso_kg ? (
                          <p className="mt-1 text-sm text-red-600">
                            {errorFila.peso_kg}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => quitarResiduo(indice)}
                        disabled={formulario.residuos.length === 1}
                        className="inline-flex size-10 items-center justify-center justify-self-start rounded-xl border border-slate-200 text-slate-500 transition-colors duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Eliminar residuo ${indice + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {errores.residuos ? (
                <p className="mt-2 text-sm text-red-600">{errores.residuos}</p>
              ) : null}
            </section>

            <section
              aria-labelledby="titulo-empleados-recojo"
              className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200"
            >
              <h3
                id="titulo-empleados-recojo"
                className="flex items-center gap-2 text-sm font-semibold text-slate-900"
              >
                <Users className="size-4 text-emerald-600" aria-hidden="true" />
                Empleados asignados
                <span className="font-normal text-slate-500">(opcional)</span>
              </h3>

              {empleadosActivos.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No hay empleados activos disponibles.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {empleadosActivos.map((empleado) => {
                    const id = Number(empleado.id_empleado);
                    const marcado = formulario.empleados.includes(id);

                    return (
                      <label
                        key={id}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors duration-200 ${
                          marcado
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternarEmpleado(id)}
                          className="size-4 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">
                          {empleado.nombres} {empleado.apellidos}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {errores.empleados ? (
                <p className="mt-2 text-sm text-red-600">{errores.empleados}</p>
              ) : null}
            </section>

            <div className="grid gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-emerald-700">
                  Capacidad del vehículo
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-900">
                  {capacidad > 0 ? formatearKg(capacidad) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700">
                  Total del recojo
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-900">
                  {formatearKg(totalKg)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700">
                  Disponible
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    disponible !== null && disponible < 0
                      ? "text-red-600"
                      : "text-emerald-900"
                  }`}
                >
                  {disponible === null ? "—" : formatearKg(disponible)}
                </p>
              </div>
            </div>

            {excedeCapacidad ? (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
                <TriangleExclamationPoint
                  className="mt-0.5 size-4 shrink-0 text-red-600"
                  aria-hidden="true"
                />
                <p className="text-sm text-red-700">
                  El peso total supera la capacidad del vehículo seleccionado.
                  Reduce el peso o elige un vehículo con mayor capacidad.
                </p>
              </div>
            ) : null}

            {errores.capacidad ? (
              <p className="text-sm text-red-600">{errores.capacidad}</p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={guardando}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || excedeCapacidad}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                {guardando ? "Guardando…" : "Registrar recojo"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {cargando ? (
        <SkeletonLista />
      ) : error ? (
        <BloqueError mensaje={error} onReintentar={recargar} />
      ) : recojos.length === 0 ? (
        <div className="tarjeta-eco px-4 py-12 text-center">
          <Truck
            className="mx-auto size-10 text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-4 text-base font-semibold text-slate-900">
            No hay recojos para mostrar
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {filtroEstado
              ? "No hay recojos con el estado seleccionado. Prueba con otro filtro o registra uno nuevo."
              : "Aún no se han registrado recojos. Crea el primero para comenzar."}
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            {filtroEstado ? (
              <button
                type="button"
                onClick={() => cambiarFiltro("")}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Ver todos
              </button>
            ) : null}
            <button
              type="button"
              onClick={abrirFormulario}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              Registrar recojo
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden tarjeta-eco md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Cliente
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Centro / destino
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Vehículo
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Fecha y hora
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Estado
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Actualizar estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recojos.map((recojo) => (
                    <tr
                      key={recojo.id_recojo}
                      className="transition-colors duration-200 even:bg-slate-50/70 hover:bg-slate-100/80"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {recojo.cliente ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          RUC {recojo.ruc ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">
                          {recojo.centro_reciclaje ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {recojo.distrito_destino ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {recojo.vehiculo_placa ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">
                          {formatearFecha(recojo.fecha_recojo)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatearHora(recojo.hora_recojo)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatearKg(recojo.total_kg)}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={recojo.estado_recojo} />
                      </td>
                      <td className="px-4 py-3">
                        <SelectorEstado
                          recojo={recojo}
                          estados={estados}
                          valor={estadosPorRecojo[recojo.id_recojo]}
                          onChange={cambiarEstadoSeleccionado}
                          onConfirmar={confirmarEstado}
                          actualizando={actualizandoId === recojo.id_recojo}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {recojos.map((recojo) => (
              <article
                key={recojo.id_recojo}
                className="tarjeta-eco p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {recojo.cliente ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      RUC {recojo.ruc ?? "—"}
                    </p>
                  </div>
                  <EstadoBadge estado={recojo.estado_recojo} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Centro</dt>
                    <dd className="text-slate-700">
                      {recojo.centro_reciclaje ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Distrito</dt>
                    <dd className="text-slate-700">
                      {recojo.distrito_destino ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Vehículo</dt>
                    <dd className="font-mono text-xs text-slate-700">
                      {recojo.vehiculo_placa ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Total</dt>
                    <dd className="font-medium text-slate-900">
                      {formatearKg(recojo.total_kg)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Fecha y hora</dt>
                    <dd className="text-slate-700">
                      {formatearFecha(recojo.fecha_recojo)} ·{" "}
                      {formatearHora(recojo.hora_recojo)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <SelectorEstado
                    recojo={recojo}
                    estados={estados}
                    valor={estadosPorRecojo[recojo.id_recojo]}
                    onChange={cambiarEstadoSeleccionado}
                    onConfirmar={confirmarEstado}
                    actualizando={actualizandoId === recojo.id_recojo}
                  />
                </div>
              </article>
            ))}
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
      )}
    </div>
  );
}
