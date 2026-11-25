import { useEffect, useState } from "react";
import {
  CircleX,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  TriangleExclamationPoint,
  Truck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  asignarCargo,
  listarEmpleados,
  obtenerHistorialCargos,
  obtenerHistorialRecojosEmpleado,
  registrarEmpleado,
} from "../services/empleadoService";
import {
  actualizarEstadoVehiculo,
  listarVehiculos,
  registrarVehiculo,
} from "../services/flotaService";
import { consultarDni } from "../services/externoService";
import { useCatalogos } from "../hooks/useCatalogos";
import ConfirmModal from "../components/ui/ConfirmModal";
import Pagination from "../components/ui/Pagination";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  formatearFecha,
  formatearHora,
  formatearKg,
  mensajeDeError,
  textoEstado,
} from "../utils/formatters";
import {
  normalizarPlaca,
  validarDni,
  validarEmpleado,
  validarSeleccion,
  validarVehiculo,
} from "../utils/validaciones";

const MENSAJE_RENIEC_POR_DEFECTO =
  "El servicio RENIEC no está disponible. Puede completar los datos manualmente.";

const PESTANAS = [
  { clave: "empleados", etiqueta: "Empleados", Icono: Users },
  { clave: "flota", etiqueta: "Flota", Icono: Truck },
];

const PAGINACION_INICIAL = Object.freeze({
  empleados: { pagina: 1, tamanioPagina: 5, total: 0, totalPaginas: 0 },
  flota: { pagina: 1, tamanioPagina: 5, total: 0, totalPaginas: 0 },
});

const BUSQUEDA_INICIAL = Object.freeze({ empleados: "", flota: "" });

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

function EstadoBadge({ estado }) {
  const activo = estado !== false;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        activo
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-red-200"
      }`}
    >
      {textoEstado(activo)}
    </span>
  );
}

const ESTADOS_VEHICULO = [
  "Disponible",
  "En Ruta",
  "Mantenimiento",
  "Inactivo",
];

const ESTILOS_ESTADO_VEHICULO = {
  Disponible: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "En Ruta": "bg-sky-50 text-sky-700 ring-sky-200",
  Mantenimiento: "bg-amber-50 text-amber-800 ring-amber-200",
  Inactivo: "bg-slate-100 text-slate-600 ring-slate-200",
};

function EstadoVehiculoBadge({ estado }) {
  const texto = estado || "—";
  const estilo =
    ESTILOS_ESTADO_VEHICULO[texto] ??
    "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${estilo}`}
    >
      {texto}
    </span>
  );
}

function textoCargo(cargo) {
  const nombre = cargo?.nombre_cargo ?? cargo?.nombre ?? "";
  const descripcion = cargo?.descripcion ?? "";
  return descripcion ? `${nombre} — ${descripcion}` : nombre;
}

function BloqueError({ titulo, mensaje, onReintentar }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <CircleX
          className="mt-0.5 size-5 shrink-0 text-red-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-red-800">{titulo}</p>
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

function SkeletonLista({ filas = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: filas }).map((_, indice) => (
        <div
          key={indice}
          className="tarjeta-eco p-4"
        >
          <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
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

function formularioEmpleadoVacio() {
  return {
    nombres: "",
    apellidos: "",
    dni: "",
    telefono: "",
    id_cargo: "",
  };
}

function formularioVehiculoVacio() {
  return {
    id_tipo_vehiculo: "",
    placa: "",
    capacidad_kg: "",
  };
}

function nombreCompleto(empleado) {
  return `${empleado?.nombres ?? ""} ${empleado?.apellidos ?? ""}`.trim();
}

function extraerNombreReniec(respuesta) {
  return (
    respuesta?.nombres ??
    respuesta?.nombres_completos ??
    respuesta?.nombre ??
    ""
  );
}

function extraerApellidosReniec(respuesta) {
  const apellidosDirectos =
    respuesta?.apellidos ?? respuesta?.apellidos_completos ?? "";
  if (String(apellidosDirectos).trim()) return apellidosDirectos;

  const paterno =
    respuesta?.apellidoPaterno ?? respuesta?.apellido_paterno ?? "";
  const materno =
    respuesta?.apellidoMaterno ?? respuesta?.apellido_materno ?? "";

  return `${paterno} ${materno}`.trim();
}

export default function OperacionesPage() {
  const { esAdmin, esSupervisor } = useAuth();
  const { toast } = useToast();
  const { catalogos } = useCatalogos();
  const puedeGestionar = esAdmin || esSupervisor;

  const [pestana, setPestana] = useState("empleados");
  const [empleados, setEmpleados] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [errorEmpleados, setErrorEmpleados] = useState("");
  const [errorFlota, setErrorFlota] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [busquedas, setBusquedas] = useState(BUSQUEDA_INICIAL);
  const [busquedasDebounced, setBusquedasDebounced] = useState(BUSQUEDA_INICIAL);
  const [paginacion, setPaginacion] = useState(PAGINACION_INICIAL);

  const [formEmpleadoAbierto, setFormEmpleadoAbierto] = useState(false);
  const [formularioEmpleado, setFormularioEmpleado] = useState(
    formularioEmpleadoVacio,
  );
  const [erroresEmpleado, setErroresEmpleado] = useState({});
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);
  const [consultandoDni, setConsultandoDni] = useState(false);
  const [avisoReniec, setAvisoReniec] = useState("");

  const [formVehiculoAbierto, setFormVehiculoAbierto] = useState(false);
  const [formularioVehiculo, setFormularioVehiculo] = useState(
    formularioVehiculoVacio,
  );
  const [erroresVehiculo, setErroresVehiculo] = useState({});
  const [guardandoVehiculo, setGuardandoVehiculo] = useState(false);

  const [modalCargo, setModalCargo] = useState(null);
  const [historial, setHistorial] = useState(null);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBusquedasDebounced({
        empleados: busquedas.empleados.trim(),
        flota: busquedas.flota.trim(),
      });
      setPaginacion((anterior) => ({
        empleados: { ...anterior.empleados, pagina: 1 },
        flota: { ...anterior.flota, pagina: 1 },
      }));
    }, 400);
    return () => window.clearTimeout(temporizador);
  }, [busquedas]);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      const [resultadoEmpleados, resultadoFlota] = await Promise.allSettled([
        listarEmpleados({
          busqueda: busquedasDebounced.empleados,
          pagina: paginacion.empleados.pagina,
          tamanio_pagina: paginacion.empleados.tamanioPagina,
        }),
        listarVehiculos({
          busqueda: busquedasDebounced.flota,
          pagina: paginacion.flota.pagina,
          tamanio_pagina: paginacion.flota.tamanioPagina,
        }),
      ]);

      if (!activo) return;

      if (resultadoEmpleados.status === "fulfilled") {
        setEmpleados(resultadoEmpleados.value.items);
        setPaginacion((anterior) => ({
          ...anterior,
          empleados: {
            ...anterior.empleados,
            total: resultadoEmpleados.value.total,
            totalPaginas: resultadoEmpleados.value.total_paginas,
          },
        }));
        setErrorEmpleados("");
      } else {
        setErrorEmpleados(mensajeDeError(resultadoEmpleados.reason));
      }

      if (resultadoFlota.status === "fulfilled") {
        setVehiculos(resultadoFlota.value.items);
        setPaginacion((anterior) => ({
          ...anterior,
          flota: {
            ...anterior.flota,
            total: resultadoFlota.value.total,
            totalPaginas: resultadoFlota.value.total_paginas,
          },
        }));
        setErrorFlota("");
      } else {
        setErrorFlota(mensajeDeError(resultadoFlota.reason));
      }

      setCargando(false);
      setRecargando(false);
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [busquedasDebounced, paginacion.empleados.pagina, paginacion.empleados.tamanioPagina, paginacion.flota.pagina, paginacion.flota.tamanioPagina, recarga]);

  function recargar() {
    setRecargando(true);
    setRecarga((valor) => valor + 1);
  }

  function cambiarBusqueda(clave, valor) {
    setBusquedas((anterior) => ({ ...anterior, [clave]: valor }));
  }

  function cambiarPagina(clave, pagina) {
    setPaginacion((anterior) => ({
      ...anterior,
      [clave]: { ...anterior[clave], pagina },
    }));
  }

  function cambiarTamanio(clave, tamanioPagina) {
    setPaginacion((anterior) => ({
      ...anterior,
      [clave]: { ...anterior[clave], pagina: 1, tamanioPagina },
    }));
  }

  function limpiarErrorEmpleado(campo) {
    setErroresEmpleado((anteriores) => {
      if (!anteriores[campo]) return anteriores;
      const siguientes = { ...anteriores };
      delete siguientes[campo];
      return siguientes;
    });
  }

  function actualizarEmpleado(campo, valor) {
    setFormularioEmpleado((anterior) => ({ ...anterior, [campo]: valor }));
    limpiarErrorEmpleado(campo);
    if (campo === "dni") setAvisoReniec("");
  }

  function limpiarErrorVehiculo(campo) {
    setErroresVehiculo((anteriores) => {
      if (!anteriores[campo]) return anteriores;
      const siguientes = { ...anteriores };
      delete siguientes[campo];
      return siguientes;
    });
  }

  function actualizarVehiculo(campo, valor) {
    setFormularioVehiculo((anterior) => ({ ...anterior, [campo]: valor }));
    limpiarErrorVehiculo(campo);
  }

  function abrirFormEmpleado() {
    setFormularioEmpleado(formularioEmpleadoVacio());
    setErroresEmpleado({});
    setAvisoReniec("");
    setFormEmpleadoAbierto(true);
    setFormVehiculoAbierto(false);
  }

  function cerrarFormEmpleado() {
    if (guardandoEmpleado) return;
    setFormEmpleadoAbierto(false);
    setErroresEmpleado({});
    setAvisoReniec("");
  }

  function abrirFormVehiculo() {
    setFormularioVehiculo(formularioVehiculoVacio());
    setErroresVehiculo({});
    setFormVehiculoAbierto(true);
    setFormEmpleadoAbierto(false);
  }

  function cerrarFormVehiculo() {
    if (guardandoVehiculo) return;
    setFormVehiculoAbierto(false);
    setErroresVehiculo({});
  }

  async function consultarReniec() {
    const errorDni = validarDni(formularioEmpleado.dni);

    if (errorDni) {
      setErroresEmpleado((anteriores) => ({ ...anteriores, dni: errorDni }));
      toast.error(errorDni);
      return;
    }

    setConsultandoDni(true);
    setAvisoReniec("");

    try {
      const respuesta = await consultarDni(formularioEmpleado.dni.trim());

      if (respuesta.manual === true) {
        const mensaje = respuesta.mensaje ?? MENSAJE_RENIEC_POR_DEFECTO;
        setAvisoReniec(mensaje);
        toast.warning(mensaje, { titulo: "RENIEC no disponible" });
        return;
      }

      const nombres = String(extraerNombreReniec(respuesta) ?? "");
      const apellidos = String(extraerApellidosReniec(respuesta) ?? "");

      setFormularioEmpleado((anterior) => ({
        ...anterior,
        nombres: anterior.nombres.trim() ? anterior.nombres : nombres,
        apellidos: anterior.apellidos.trim() ? anterior.apellidos : apellidos,
      }));

      setErroresEmpleado((anteriores) => {
        const siguientes = { ...anteriores };
        delete siguientes.nombres;
        delete siguientes.apellidos;
        return siguientes;
      });

      toast.info("Datos de RENIEC cargados. Verifica la información.");
    } catch {
      setAvisoReniec(MENSAJE_RENIEC_POR_DEFECTO);
      toast.warning(MENSAJE_RENIEC_POR_DEFECTO, {
        titulo: "RENIEC no disponible",
      });
    } finally {
      setConsultandoDni(false);
    }
  }

  async function manejarEnvioEmpleado(evento) {
    evento.preventDefault();

    const resultado = validarEmpleado(formularioEmpleado);

    if (!resultado.valido) {
      setErroresEmpleado(resultado.errores);
      toast.error("Revisa los datos del empleado.");
      return;
    }

    setGuardandoEmpleado(true);

    try {
      await registrarEmpleado({
        nombres: formularioEmpleado.nombres,
        apellidos: formularioEmpleado.apellidos,
        dni: formularioEmpleado.dni,
        telefono: formularioEmpleado.telefono,
        id_cargo: formularioEmpleado.id_cargo,
      });
      toast.success("Empleado registrado correctamente.");
      setFormEmpleadoAbierto(false);
      setFormularioEmpleado(formularioEmpleadoVacio());
      setErroresEmpleado({});
      setAvisoReniec("");
      recargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardandoEmpleado(false);
    }
  }

  async function manejarEnvioVehiculo(evento) {
    evento.preventDefault();

    const resultado = validarVehiculo(formularioVehiculo);

    if (!resultado.valido) {
      setErroresVehiculo(resultado.errores);
      toast.error("Revisa los datos del vehículo.");
      return;
    }

    setGuardandoVehiculo(true);

    try {
      await registrarVehiculo({
        id_tipo_vehiculo: formularioVehiculo.id_tipo_vehiculo,
        placa: normalizarPlaca(formularioVehiculo.placa),
        capacidad_kg: formularioVehiculo.capacidad_kg,
      });
      toast.success("Vehículo registrado correctamente.");
      setFormVehiculoAbierto(false);
      setFormularioVehiculo(formularioVehiculoVacio());
      setErroresVehiculo({});
      recargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardandoVehiculo(false);
    }
  }

  async function cambiarEstadoVehiculo(vehiculo, estado) {
    if (!puedeGestionar || estado === vehiculo.estado) return;

    try {
      await actualizarEstadoVehiculo(vehiculo.id_vehiculo, estado);
      toast.success("Estado del vehículo actualizado correctamente.");
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      recargar();
    }
  }

  function abrirModalCargo(empleado) {
    setModalCargo({
      empleado,
      idCargo: empleado.id_cargo_actual ?? "",
      guardando: false,
      error: "",
    });
  }

  function cerrarModalCargo() {
    if (modalCargo?.guardando) return;
    setModalCargo(null);
  }

  async function confirmarCargo() {
    if (!modalCargo || modalCargo.guardando) return;

    const errorCargo = validarSeleccion(
      modalCargo.idCargo,
      "Selecciona un cargo.",
    );

    if (errorCargo) {
      setModalCargo((actual) => ({ ...actual, error: errorCargo }));
      return;
    }

    setModalCargo((actual) => ({ ...actual, guardando: true, error: "" }));

    try {
      await asignarCargo(modalCargo.empleado.id_empleado, modalCargo.idCargo);
      toast.success("Cargo asignado correctamente.");
      setModalCargo(null);
      recargar();
    } catch (err) {
      const mensaje = mensajeDeError(err);
      setModalCargo((actual) =>
        actual ? { ...actual, guardando: false, error: mensaje } : actual,
      );
      toast.error(mensaje);
    }
  }

  async function abrirHistorial(empleado) {
    setHistorial({
      empleado,
      pestana: "cargos",
      cargando: true,
      datos: [],
      error: "",
      cargandoRecojos: true,
      datosRecojos: [],
      errorRecojos: "",
    });

    const [resultadoCargos, resultadoRecojos] = await Promise.allSettled([
      obtenerHistorialCargos(empleado.id_empleado),
      obtenerHistorialRecojosEmpleado(empleado.id_empleado),
    ]);

    setHistorial((actual) =>
      actual && actual.empleado.id_empleado === empleado.id_empleado
        ? {
            ...actual,
            cargando: false,
            datos:
              resultadoCargos.status === "fulfilled" ? resultadoCargos.value : [],
            error:
              resultadoCargos.status === "rejected"
                ? mensajeDeError(resultadoCargos.reason)
                : "",
            cargandoRecojos: false,
            datosRecojos:
              resultadoRecojos.status === "fulfilled"
                ? resultadoRecojos.value
                : [],
            errorRecojos:
              resultadoRecojos.status === "rejected"
                ? mensajeDeError(resultadoRecojos.reason)
                : "",
          }
        : actual,
    );

    for (const resultado of [resultadoCargos, resultadoRecojos]) {
      if (resultado.status === "rejected") {
        toast.error(mensajeDeError(resultado.reason));
      }
    }
  }

  function cambiarPestanaHistorial(pestana) {
    setHistorial((actual) => (actual ? { ...actual, pestana } : actual));
  }

  function cerrarHistorial() {
    setHistorial(null);
  }

  const historialOrdenado = historial
    ? [...historial.datos].sort((a, b) =>
        String(b.fecha_inicio ?? "").localeCompare(
          String(a.fecha_inicio ?? ""),
        ),
      )
    : [];

  const historialRecojos = historial
    ? [...historial.datosRecojos].sort((a, b) => {
        const porFecha = String(b?.fecha_recojo ?? "").localeCompare(
          String(a?.fecha_recojo ?? ""),
        );
        if (porFecha !== 0) return porFecha;

        const porHora = String(b?.hora_recojo ?? "").localeCompare(
          String(a?.hora_recojo ?? ""),
        );
        if (porHora !== 0) return porHora;

        return Number(b?.id_recojo ?? 0) - Number(a?.id_recojo ?? 0);
      })
    : [];

  const totalKgHistorial = historialRecojos.reduce(
    (total, recojo) => total + (Number(recojo.total_kg) || 0),
    0,
  );

  const dniValido = validarDni(formularioEmpleado.dni) === null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Equipo</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Operaciones
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona al personal, sus cargos y la flota de vehículos.
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

          {puedeGestionar && pestana === "empleados" ? (
            <button
              type="button"
              onClick={abrirFormEmpleado}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              + Nuevo empleado
            </button>
          ) : null}

          {puedeGestionar && pestana === "flota" ? (
            <button
              type="button"
              onClick={abrirFormVehiculo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              + Nuevo vehículo
            </button>
          ) : null}
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Secciones de operaciones"
        className="inline-flex w-full gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 sm:w-auto"
      >
        {PESTANAS.map(({ clave, etiqueta, Icono }) => {
          const activa = pestana === clave;
          const total = paginacion[clave].total;

          return (
            <button
              key={clave}
              type="button"
              role="tab"
              aria-selected={activa}
              aria-controls={`panel-${clave}`}
              id={`tab-${clave}`}
              onClick={() => setPestana(clave)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:flex-none ${
                activa
                  ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700/10"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Icono className="size-4" aria-hidden="true" />
              {etiqueta}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activa
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {total}
              </span>
            </button>
          );
        })}
      </div>

      {pestana === "empleados" ? (
        <div
          role="tabpanel"
          id="panel-empleados"
          aria-labelledby="tab-empleados"
          className="space-y-6"
        >
          {puedeGestionar && formEmpleadoAbierto ? (
            <section
              aria-labelledby="titulo-form-empleado"
              className="tarjeta-eco p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="titulo-form-empleado"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Registrar empleado
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Consulta el DNI en RENIEC o completa los nombres
                    manualmente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarFormEmpleado}
                  disabled={guardandoEmpleado}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Cerrar formulario de empleado"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              {avisoReniec ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
                  <TriangleExclamationPoint
                    className="mt-0.5 size-4 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-amber-800">{avisoReniec}</p>
                </div>
              ) : null}

              <form
                onSubmit={manejarEnvioEmpleado}
                noValidate
                className="mt-5 space-y-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Campo
                      etiqueta="DNI"
                      htmlFor="empleado-dni"
                      error={erroresEmpleado.dni}
                      requerido
                      ayuda="8 dígitos. Puedes autocompletar los nombres con RENIEC."
                    >
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <input
                          id="empleado-dni"
                          inputMode="numeric"
                          maxLength={8}
                          value={formularioEmpleado.dni}
                          onChange={(evento) =>
                            actualizarEmpleado(
                              "dni",
                              evento.target.value
                                .replace(/\D/g, "")
                                .slice(0, 8),
                            )
                          }
                          className={claseInput(Boolean(erroresEmpleado.dni))}
                          placeholder="70123456"
                          aria-invalid={Boolean(erroresEmpleado.dni)}
                        />
                        <button
                          type="button"
                          onClick={consultarReniec}
                          disabled={!dniValido || consultandoDni}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {consultandoDni ? (
                            <LoaderCircle
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Search className="size-4" aria-hidden="true" />
                          )}
                          {consultandoDni
                            ? "Consultando…"
                            : "Consultar RENIEC"}
                        </button>
                      </div>
                    </Campo>
                  </div>

                  <Campo
                    etiqueta="Nombres"
                    htmlFor="empleado-nombres"
                    error={erroresEmpleado.nombres}
                    requerido
                  >
                    <input
                      id="empleado-nombres"
                      value={formularioEmpleado.nombres}
                      onChange={(evento) =>
                        actualizarEmpleado("nombres", evento.target.value)
                      }
                      className={claseInput(
                        Boolean(erroresEmpleado.nombres),
                      )}
                      placeholder="María Elena"
                      aria-invalid={Boolean(erroresEmpleado.nombres)}
                    />
                  </Campo>

                  <Campo
                    etiqueta="Apellidos"
                    htmlFor="empleado-apellidos"
                    error={erroresEmpleado.apellidos}
                    requerido
                  >
                    <input
                      id="empleado-apellidos"
                      value={formularioEmpleado.apellidos}
                      onChange={(evento) =>
                        actualizarEmpleado("apellidos", evento.target.value)
                      }
                      className={claseInput(
                        Boolean(erroresEmpleado.apellidos),
                      )}
                      placeholder="Quispe Ramos"
                      aria-invalid={Boolean(erroresEmpleado.apellidos)}
                    />
                  </Campo>

                  <Campo
                    etiqueta="Teléfono"
                    htmlFor="empleado-telefono"
                    error={erroresEmpleado.telefono}
                    ayuda="Opcional, 6 a 15 caracteres."
                  >
                    <input
                      id="empleado-telefono"
                      type="tel"
                      value={formularioEmpleado.telefono}
                      onChange={(evento) =>
                        actualizarEmpleado("telefono", evento.target.value)
                      }
                      className={claseInput(
                        Boolean(erroresEmpleado.telefono),
                      )}
                      placeholder="964123456"
                      aria-invalid={Boolean(erroresEmpleado.telefono)}
                    />
                  </Campo>

                  <Campo
                    etiqueta="Cargo"
                    htmlFor="empleado-cargo"
                    error={erroresEmpleado.id_cargo}
                    requerido
                  >
                    <select
                      id="empleado-cargo"
                      value={formularioEmpleado.id_cargo}
                      onChange={(evento) =>
                        actualizarEmpleado("id_cargo", evento.target.value)
                      }
                      className={claseInput(
                        Boolean(erroresEmpleado.id_cargo),
                      )}
                      aria-invalid={Boolean(erroresEmpleado.id_cargo)}
                    >
                      <option value="">Selecciona un cargo</option>
                      {catalogos.cargos.map((cargo) => (
                        <option key={cargo.id} value={cargo.id}>
                          {cargo.nombre}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cerrarFormEmpleado}
                    disabled={guardandoEmpleado}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoEmpleado}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {guardandoEmpleado ? (
                      <LoaderCircle
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    {guardandoEmpleado
                      ? "Guardando…"
                      : "Registrar empleado"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <div className="flex flex-col gap-3 tarjeta-eco p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="buscar-empleado" className="sr-only">
                Buscar empleado
              </label>
              <input
                id="buscar-empleado"
                type="search"
                value={busquedas.empleados}
                onChange={(evento) =>
                  cambiarBusqueda("empleados", evento.target.value)
                }
                placeholder="Buscar por nombre, apellido o DNI…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition-colors duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
            <p className="text-sm text-slate-500">
              {paginacion.empleados.total.toLocaleString("es-PE")}{" "}
              {paginacion.empleados.total === 1
                ? "empleado encontrado"
                : "empleados encontrados"}
            </p>
          </div>

          {errorEmpleados ? (
            <BloqueError
              titulo="No se pudieron cargar los empleados"
              mensaje={errorEmpleados}
              onReintentar={recargar}
            />
          ) : null}

          {cargando ? (
            <SkeletonLista />
          ) : empleados.length === 0 && !errorEmpleados ? (
            <div className="tarjeta-eco px-4 py-12 text-center">
              <Users
                className="mx-auto size-10 text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-4 text-base font-semibold text-slate-900">
                Aún no hay empleados registrados
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {puedeGestionar
                  ? "Registra al primer empleado para asignarle un cargo y vincularlo a un usuario."
                  : "Cuando se registre personal aparecerá aquí."}
              </p>
              {puedeGestionar ? (
                <button
                  type="button"
                  onClick={abrirFormEmpleado}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  + Nuevo empleado
                </button>
              ) : null}
            </div>
          ) : empleados.length > 0 ? (
            <>
              <div className="hidden overflow-hidden tarjeta-eco md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Empleado
                        </th>
                        <th scope="col" className="px-4 py-3">
                          DNI
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Teléfono
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Cargo actual
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Estado
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {empleados.map((empleado) => (
                        <tr
                          key={empleado.id_empleado}
                          className="transition-colors duration-200 even:bg-slate-50/70 hover:bg-slate-100/80"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {nombreCompleto(empleado)}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700">
                            {empleado.dni ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {empleado.telefono ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {empleado.cargo_actual ?? "Sin cargo"}
                          </td>
                          <td className="px-4 py-3">
                            <EstadoBadge estado={empleado.estado} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {esAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => abrirModalCargo(empleado)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                  <UserPlus
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  Asignar cargo
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => abrirHistorial(empleado)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                              >
                                <History
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                                Historial
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-3 md:hidden">
                {empleados.map((empleado) => (
                  <article
                    key={empleado.id_empleado}
                    className="tarjeta-eco p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {nombreCompleto(empleado)}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          DNI {empleado.dni ?? "—"}
                        </p>
                      </div>
                      <EstadoBadge estado={empleado.estado} />
                    </div>

                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">Cargo actual</dt>
                        <dd className="text-slate-700">
                          {empleado.cargo_actual ?? "Sin cargo"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Teléfono</dt>
                        <dd className="text-slate-700">
                          {empleado.telefono ?? "—"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex flex-col gap-2">
                      {esAdmin ? (
                        <button
                          type="button"
                          onClick={() => abrirModalCargo(empleado)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <UserPlus className="size-4" aria-hidden="true" />
                          Asignar cargo
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => abrirHistorial(empleado)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <History className="size-4" aria-hidden="true" />
                        Ver historial de cargos
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="overflow-hidden tarjeta-eco">
                <Pagination
                  pagina={paginacion.empleados.pagina}
                  totalPaginas={paginacion.empleados.totalPaginas}
                  total={paginacion.empleados.total}
                  tamanioPagina={paginacion.empleados.tamanioPagina}
                  onPageChange={(valor) => cambiarPagina("empleados", valor)}
                  onTamanioChange={(valor) => cambiarTamanio("empleados", valor)}
                />
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-flota"
          aria-labelledby="tab-flota"
          className="space-y-6"
        >
          {puedeGestionar && formVehiculoAbierto ? (
            <section
              aria-labelledby="titulo-form-vehiculo"
              className="tarjeta-eco p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="titulo-form-vehiculo"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Registrar vehículo
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    La placa se normaliza al formato peruano (ej. ABC-123).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarFormVehiculo}
                  disabled={guardandoVehiculo}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Cerrar formulario de vehículo"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <form
                onSubmit={manejarEnvioVehiculo}
                noValidate
                className="mt-5 space-y-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    etiqueta="Tipo de vehículo"
                    htmlFor="vehiculo-tipo"
                    error={erroresVehiculo.id_tipo_vehiculo}
                    requerido
                  >
                    <select
                      id="vehiculo-tipo"
                      value={formularioVehiculo.id_tipo_vehiculo}
                      onChange={(evento) =>
                        actualizarVehiculo(
                          "id_tipo_vehiculo",
                          evento.target.value,
                        )
                      }
                      className={claseInput(
                        Boolean(erroresVehiculo.id_tipo_vehiculo),
                      )}
                      aria-invalid={Boolean(
                        erroresVehiculo.id_tipo_vehiculo,
                      )}
                    >
                      <option value="">Selecciona un tipo</option>
                      {catalogos.tipos_vehiculo.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  <Campo
                    etiqueta="Placa"
                    htmlFor="vehiculo-placa"
                    error={erroresVehiculo.placa}
                    requerido
                    ayuda="Formatos: ABC-123, AB-1234 o A1B-234."
                  >
                    <input
                      id="vehiculo-placa"
                      value={formularioVehiculo.placa}
                      onChange={(evento) =>
                        actualizarVehiculo(
                          "placa",
                          evento.target.value.toUpperCase().slice(0, 8),
                        )
                      }
                      onBlur={() =>
                        actualizarVehiculo(
                          "placa",
                          normalizarPlaca(formularioVehiculo.placa),
                        )
                      }
                      className={claseInput(
                        Boolean(erroresVehiculo.placa),
                      )}
                      placeholder="ABC-123"
                      aria-invalid={Boolean(erroresVehiculo.placa)}
                    />
                  </Campo>

                  <Campo
                    etiqueta="Capacidad (kg)"
                    htmlFor="vehiculo-capacidad"
                    error={erroresVehiculo.capacidad_kg}
                    requerido
                  >
                    <input
                      id="vehiculo-capacidad"
                      type="number"
                      min="100"
                      step="0.01"
                      inputMode="decimal"
                      value={formularioVehiculo.capacidad_kg}
                      onChange={(evento) =>
                        actualizarVehiculo(
                          "capacidad_kg",
                          evento.target.value,
                        )
                      }
                      className={claseInput(
                        Boolean(erroresVehiculo.capacidad_kg),
                      )}
                      placeholder="3500"
                      aria-invalid={Boolean(erroresVehiculo.capacidad_kg)}
                    />
                  </Campo>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cerrarFormVehiculo}
                    disabled={guardandoVehiculo}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoVehiculo}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {guardandoVehiculo ? (
                      <LoaderCircle
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    {guardandoVehiculo
                      ? "Guardando…"
                      : "Registrar vehículo"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <div className="flex flex-col gap-3 tarjeta-eco p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="buscar-flota" className="sr-only">
                Buscar vehículo
              </label>
              <input
                id="buscar-flota"
                type="search"
                value={busquedas.flota}
                onChange={(evento) => cambiarBusqueda("flota", evento.target.value)}
                placeholder="Buscar por placa o tipo…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition-colors duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
            <p className="text-sm text-slate-500">
              {paginacion.flota.total.toLocaleString("es-PE")}{" "}
              {paginacion.flota.total === 1
                ? "vehículo encontrado"
                : "vehículos encontrados"}
            </p>
          </div>

          {errorFlota ? (
            <BloqueError
              titulo="No se pudo cargar la flota"
              mensaje={errorFlota}
              onReintentar={recargar}
            />
          ) : null}

          {cargando ? (
            <SkeletonLista />
          ) : vehiculos.length === 0 && !errorFlota ? (
            <div className="tarjeta-eco px-4 py-12 text-center">
              <Truck
                className="mx-auto size-10 text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-4 text-base font-semibold text-slate-900">
                La flota está vacía
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {puedeGestionar
                  ? "Registra el primer vehículo para poder programar recojos."
                  : "Cuando se registren vehículos aparecerán aquí."}
              </p>
              {puedeGestionar ? (
                <button
                  type="button"
                  onClick={abrirFormVehiculo}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  + Nuevo vehículo
                </button>
              ) : null}
            </div>
          ) : vehiculos.length > 0 ? (
            <>
              <div className="hidden overflow-hidden tarjeta-eco md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Placa
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Tipo
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Capacidad
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Estado
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vehiculos.map((vehiculo) => (
                        <tr
                          key={vehiculo.id_vehiculo}
                          className="transition-colors duration-200 even:bg-slate-50/70 hover:bg-slate-100/80"
                        >
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900">
                            {vehiculo.placa ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {vehiculo.tipo_vehiculo ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {formatearKg(vehiculo.capacidad_kg)}
                          </td>
                          <td className="px-4 py-3">
                            <EstadoVehiculoBadge estado={vehiculo.estado} />
                          </td>
                          <td className="px-4 py-3">
                            {puedeGestionar ? (
                              <select
                                aria-label={`Cambiar estado del vehículo ${vehiculo.placa ?? ""}`}
                                value={vehiculo.estado ?? ""}
                                onChange={(evento) =>
                                  cambiarEstadoVehiculo(
                                    vehiculo,
                                    evento.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                              >
                                {ESTADOS_VEHICULO.map((estado) => (
                                  <option key={estado} value={estado}>
                                    {estado}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-3 md:hidden">
                {vehiculos.map((vehiculo) => (
                  <article
                    key={vehiculo.id_vehiculo}
                    className="tarjeta-eco p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-base font-semibold text-slate-900">
                          {vehiculo.placa ?? "—"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {vehiculo.tipo_vehiculo ?? "—"}
                        </p>
                      </div>
                      <EstadoVehiculoBadge estado={vehiculo.estado} />
                    </div>

                    <dl className="mt-3">
                      <dt className="text-xs text-slate-500">Capacidad</dt>
                      <dd className="text-sm text-slate-700">
                        {formatearKg(vehiculo.capacidad_kg)}
                      </dd>
                    </dl>

                    {puedeGestionar ? (
                      <div className="mt-3">
                        <label
                          htmlFor={`estado-vehiculo-${vehiculo.id_vehiculo}`}
                          className="mb-1 block text-xs font-medium text-slate-600"
                        >
                          Cambiar estado
                        </label>
                        <select
                          id={`estado-vehiculo-${vehiculo.id_vehiculo}`}
                          value={vehiculo.estado ?? ""}
                          onChange={(evento) =>
                            cambiarEstadoVehiculo(
                              vehiculo,
                              evento.target.value,
                            )
                          }
                          className={claseInput(false)}
                        >
                          {ESTADOS_VEHICULO.map((estado) => (
                            <option key={estado} value={estado}>
                              {estado}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="overflow-hidden tarjeta-eco">
                <Pagination
                  pagina={paginacion.flota.pagina}
                  totalPaginas={paginacion.flota.totalPaginas}
                  total={paginacion.flota.total}
                  tamanioPagina={paginacion.flota.tamanioPagina}
                  onPageChange={(valor) => cambiarPagina("flota", valor)}
                  onTamanioChange={(valor) => cambiarTamanio("flota", valor)}
                />
              </div>
            </>
          ) : null}
        </div>
      )}

      <ConfirmModalCargo
        modal={modalCargo}
        cargos={catalogos.cargos}
        onCambiarCargo={(valor) =>
          setModalCargo((actual) =>
            actual ? { ...actual, idCargo: valor, error: "" } : actual,
          )
        }
        onConfirmar={confirmarCargo}
        onCerrar={cerrarModalCargo}
      />

      {historial ? (
        <div className="fixed inset-0 z-[85] flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={cerrarHistorial}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-historial"
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <h2
                  id="titulo-historial"
                  className="text-lg font-semibold text-slate-900"
                >
                  Historial del empleado
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {nombreCompleto(historial.empleado)}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarHistorial}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Cerrar historial del empleado"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div
              role="tablist"
              aria-label="Secciones del historial"
              className="flex gap-2 border-b border-slate-200 px-5 sm:px-6"
            >
              {[
                { clave: "cargos", etiqueta: "Historial de cargos" },
                { clave: "recojos", etiqueta: "Recojos realizados" },
              ].map(({ clave, etiqueta }) => {
                const activa = historial.pestana === clave;

                return (
                  <button
                    key={clave}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    aria-controls={`panel-historial-${clave}`}
                    onClick={() => cambiarPestanaHistorial(clave)}
                    className={`border-b-2 px-1 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      activa
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {etiqueta}
                  </button>
                );
              })}
            </div>

            <div
              id={`panel-historial-${historial.pestana}`}
              role="tabpanel"
              className="flex-1 overflow-y-auto p-5 sm:p-6"
            >
              {historial.pestana === "cargos" ? (
                historial.cargando ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, indice) => (
                    <div key={indice} className="flex gap-3">
                      <div className="mt-1 size-3 shrink-0 animate-pulse rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                        <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : historial.error ? (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
                  <CircleX
                    className="mt-0.5 size-4 shrink-0 text-red-600"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-red-700">{historial.error}</p>
                </div>
              ) : historialOrdenado.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Este empleado todavía no tiene cargos registrados.
                </p>
              ) : (
                <ol className="space-y-5">
                  {historialOrdenado.map((registro) => {
                    const estadoTexto =
                      registro.estado ??
                      (registro.fecha_fin ? "Finalizado" : "Vigente");
                    const vigente =
                      String(estadoTexto).trim().toLowerCase() === "vigente";

                    return (
                      <li
                        key={registro.id_empleado_cargo}
                        className="relative flex gap-3 pl-1"
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`mt-1 size-3 shrink-0 rounded-full ring-4 ${
                              vigente
                                ? "bg-emerald-500 ring-emerald-100"
                                : "bg-slate-300 ring-slate-100"
                            }`}
                          />
                          <span className="mt-1 w-px flex-1 bg-slate-200" />
                        </div>
                        <div className="pb-1">
                          <p className="font-semibold text-slate-900">
                            {registro.nombre_cargo ?? "Cargo"}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-600">
                            Desde {formatearFecha(registro.fecha_inicio)} hasta{" "}
                            {registro.fecha_fin
                              ? formatearFecha(registro.fecha_fin)
                              : "Actualidad"}
                          </p>
                          <span
                            className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                              vigente
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {estadoTexto}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                )
              ) : (
                historial.cargandoRecojos ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, indice) => (
                      <div
                        key={indice}
                        className="h-20 animate-pulse rounded-xl bg-slate-100"
                      />
                    ))}
                  </div>
                ) : historial.errorRecojos ? (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
                    <CircleX
                      className="mt-0.5 size-4 shrink-0 text-red-600"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-red-700">
                      {historial.errorRecojos}
                    </p>
                  </div>
                ) : historialRecojos.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Este empleado todavía no tiene recojos registrados.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                        <p className="text-xs font-semibold text-emerald-800">
                          Servicios realizados
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-900">
                          {historialRecojos.length}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-slate-600">
                          Total kg movilizados
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {formatearKg(totalKgHistorial)}
                        </p>
                      </div>
                    </div>

                    <ul className="mt-5 space-y-3">
                      {historialRecojos.map((recojo) => (
                        <li
                          key={recojo.id_recojo}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {recojo.cliente ?? `Recojo #${recojo.id_recojo}`}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {formatearFecha(recojo.fecha_recojo)} ·{" "}
                                {formatearHora(recojo.hora_recojo)}
                              </p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {recojo.estado_recojo ?? "—"}
                            </span>
                          </div>
                          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <div>
                              <dt className="text-slate-500">Placa</dt>
                              <dd className="font-medium text-slate-800">
                                {recojo.vehiculo_placa ?? "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Rol en el recojo</dt>
                              <dd className="font-medium text-slate-800">
                                {recojo.rol_en_recojo ?? "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Centro de reciclaje</dt>
                              <dd className="font-medium text-slate-800">
                                {recojo.centro_reciclaje ?? "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Kilogramos</dt>
                              <dd className="font-medium text-slate-800">
                                {formatearKg(recojo.total_kg)}
                              </dd>
                            </div>
                          </dl>
                        </li>
                      ))}
                    </ul>
                  </>
                )
              )}
            </div>

            <div className="border-t border-slate-200 p-5 sm:p-6">
              <button
                type="button"
                onClick={cerrarHistorial}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConfirmModalCargo({
  modal,
  cargos,
  onCambiarCargo,
  onConfirmar,
  onCerrar,
}) {
  return (
    <ConfirmModal
      abierto={Boolean(modal)}
      titulo="Asignar cargo"
      mensaje={
        modal
          ? `Selecciona el nuevo cargo para ${nombreCompleto(modal.empleado)}.`
          : undefined
      }
      confirmarTexto="Asignar cargo"
      cancelarTexto="Cancelar"
      variante="advertencia"
      cargando={modal?.guardando ?? false}
      onConfirmar={onConfirmar}
      onCerrar={onCerrar}
    >
      <Campo
        etiqueta="Cargo"
        htmlFor="asignar-cargo"
        error={modal?.error}
        requerido
      >
        <select
          id="asignar-cargo"
          value={modal?.idCargo ?? ""}
          onChange={(evento) => onCambiarCargo(evento.target.value)}
          disabled={modal?.guardando}
          className={claseInput(Boolean(modal?.error))}
        >
          <option value="">Selecciona un cargo</option>
          {cargos.map((cargo) => (
            <option key={cargo.id} value={cargo.id}>
              {textoCargo(cargo)}
            </option>
          ))}
        </select>
      </Campo>
    </ConfirmModal>
  );
}
