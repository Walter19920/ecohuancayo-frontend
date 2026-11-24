import { useEffect, useRef, useState } from "react";
import {
  Building,
  CircleX,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  TriangleExclamationPoint,
  X,
} from "lucide-react";
import {
  actualizarCliente,
  crearCliente,
  listarClientes,
} from "../services/clienteService";
import { consultarRuc } from "../services/externoService";
import { useToast } from "../context/ToastContext";
import {
  mensajeDeError,
  textoEstado,
} from "../utils/formatters";
import { validarCliente, validarRuc } from "../utils/validaciones";
import Pagination from "../components/ui/Pagination";

const MENSAJE_SUNAT_POR_DEFECTO =
  "El servicio SUNAT no está disponible. Puede completar los datos manualmente.";

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

function formularioVacio() {
  return {
    razon_social: "",
    ruc: "",
    direccion: "",
    correo: "",
    telefono: "",
    estado: true,
  };
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
            No se pudieron cargar los clientes
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

function SkeletonLista() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, indice) => (
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

export default function ClientesPage() {
  const { toast } = useToast();

  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [tamanioPagina, setTamanioPagina] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [modo, setModo] = useState(null);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [avisoSunat, setAvisoSunat] = useState("");

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
        const respuesta = await listarClientes({
          busqueda: busquedaDebounced,
          pagina,
          tamanio_pagina: tamanioPagina,
        });
        if (!activo) return;
        setClientes(respuesta.items);
        setTotal(respuesta.total);
        setTotalPaginas(respuesta.total_paginas);
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
  }, [busquedaDebounced, pagina, tamanioPagina, recarga]);

  useEffect(() => {
    if (modo && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [modo]);

  const buscando = busqueda.trim() !== busquedaDebounced;
  const rucValido = validarRuc(formulario.ruc) === null;

  function limpiarError(campo) {
    setErrores((anteriores) => {
      if (!anteriores[campo]) return anteriores;
      const siguientes = { ...anteriores };
      delete siguientes[campo];
      return siguientes;
    });
  }

  function actualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    limpiarError(campo);
    if (campo === "ruc") setAvisoSunat("");
  }

  function abrirCrear() {
    setModo("crear");
    setClienteEditando(null);
    setFormulario(formularioVacio());
    setErrores({});
    setAvisoSunat("");
  }

  function abrirEditar(cliente) {
    setModo("editar");
    setClienteEditando(cliente);
    setFormulario({
      razon_social: cliente.razon_social ?? "",
      ruc: cliente.ruc ?? "",
      direccion: cliente.direccion ?? "",
      correo: cliente.correo ?? "",
      telefono: cliente.telefono ?? "",
      estado: cliente.estado !== false,
    });
    setErrores({});
    setAvisoSunat("");
  }

  function cerrarFormulario() {
    if (guardando) return;
    setModo(null);
    setClienteEditando(null);
    setErrores({});
    setAvisoSunat("");
  }

  function recargar() {
    setRecargando(true);
    setRecarga((valor) => valor + 1);
  }

  async function consultarSunat() {
    const errorRuc = validarRuc(formulario.ruc);

    if (errorRuc) {
      setErrores((anteriores) => ({ ...anteriores, ruc: errorRuc }));
      toast.error(errorRuc);
      return;
    }

    setConsultando(true);
    setAvisoSunat("");

    try {
      const respuesta = await consultarRuc(formulario.ruc.trim());

      if (respuesta.manual === true) {
        const mensaje = respuesta.mensaje ?? MENSAJE_SUNAT_POR_DEFECTO;
        setAvisoSunat(mensaje);
        toast.warning(mensaje, { titulo: "SUNAT no disponible" });
        return;
      }

      const razonSocial =
        respuesta.razon_social ??
        respuesta.razonSocial ??
        respuesta.nombre ??
        "";
      const direccion =
        respuesta.direccion ?? respuesta.domicilio_fiscal ?? "";

      setFormulario((anterior) => ({
        ...anterior,
        razon_social: anterior.razon_social.trim()
          ? anterior.razon_social
          : String(razonSocial ?? ""),
        direccion: anterior.direccion.trim()
          ? anterior.direccion
          : String(direccion ?? ""),
      }));

      setErrores((anteriores) => {
        const siguientes = { ...anteriores };
        delete siguientes.razon_social;
        delete siguientes.direccion;
        return siguientes;
      });

      toast.info("Datos de SUNAT cargados. Verifica la información.");
    } catch {
      setAvisoSunat(MENSAJE_SUNAT_POR_DEFECTO);
      toast.warning(MENSAJE_SUNAT_POR_DEFECTO, {
        titulo: "SUNAT no disponible",
      });
    } finally {
      setConsultando(false);
    }
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esEdicion = modo === "editar";
    const resultado = validarCliente(formulario, { esEdicion });

    if (!resultado.valido) {
      setErrores(resultado.errores);
      toast.error("Revisa los datos del cliente.");
      return;
    }

    setGuardando(true);

    try {
      if (esEdicion && clienteEditando) {
        await actualizarCliente(clienteEditando.id_cliente, {
          razon_social: formulario.razon_social,
          direccion: formulario.direccion,
          correo: formulario.correo,
          telefono: formulario.telefono,
          estado: formulario.estado,
        });
        toast.success("Cliente actualizado correctamente.");
      } else {
        await crearCliente({
          razon_social: formulario.razon_social,
          ruc: formulario.ruc,
          direccion: formulario.direccion,
          correo: formulario.correo,
          telefono: formulario.telefono,
        });
        toast.success("Cliente registrado correctamente.");
      }

      setModo(null);
      setClienteEditando(null);
      setErrores({});
      setAvisoSunat("");
      setRecargando(true);
      setRecarga((valor) => valor + 1);
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  const tituloFormulario =
    modo === "editar" ? "Editar cliente" : "Nuevo cliente";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Padrón</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Administra las empresas y personas que atiende EcoHuancayo.
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
            onClick={abrirCrear}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo cliente
          </button>
        </div>
      </header>

      {modo ? (
        <section
          ref={formRef}
          aria-labelledby="titulo-formulario-cliente"
          className="scroll-mt-24 tarjeta-eco p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="titulo-formulario-cliente"
                className="text-lg font-semibold text-slate-900"
              >
                {tituloFormulario}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {modo === "editar"
                  ? "Actualiza los datos de contacto y el estado del cliente."
                  : "Completa los datos. Puedes consultar la razón social en SUNAT."}
              </p>
            </div>
            <button
              type="button"
              onClick={cerrarFormulario}
              disabled={guardando}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Cerrar formulario de cliente"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {avisoSunat ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <TriangleExclamationPoint
                className="mt-0.5 size-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <p className="text-sm text-amber-800">{avisoSunat}</p>
            </div>
          ) : null}

          <form onSubmit={manejarEnvio} noValidate className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo
                  etiqueta="RUC"
                  htmlFor="cliente-ruc"
                  error={errores.ruc}
                  requerido={modo !== "editar"}
                  ayuda={
                    modo === "editar"
                      ? "El RUC no se puede modificar en la edición."
                      : "11 dígitos, debe comenzar con 10 o 20."
                  }
                >
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      id="cliente-ruc"
                      inputMode="numeric"
                      maxLength={11}
                      value={formulario.ruc}
                      onChange={(evento) =>
                        actualizarCampo(
                          "ruc",
                          evento.target.value.replace(/\D/g, "").slice(0, 11),
                        )
                      }
                      readOnly={modo === "editar"}
                      className={`${claseInput(Boolean(errores.ruc))} ${
                        modo === "editar"
                          ? "bg-slate-50 text-slate-500"
                          : ""
                      }`}
                      placeholder="20123456789"
                      aria-invalid={Boolean(errores.ruc)}
                    />
                    {modo !== "editar" ? (
                      <button
                        type="button"
                        onClick={consultarSunat}
                        disabled={!rucValido || consultando}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {consultando ? (
                          <LoaderCircle
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Search className="size-4" aria-hidden="true" />
                        )}
                        {consultando ? "Consultando…" : "Consultar SUNAT"}
                      </button>
                    ) : null}
                  </div>
                </Campo>
              </div>

              <div className="sm:col-span-2">
                <Campo
                  etiqueta="Razón social"
                  htmlFor="cliente-razon"
                  error={errores.razon_social}
                  requerido
                >
                  <input
                    id="cliente-razon"
                    value={formulario.razon_social}
                    onChange={(evento) =>
                      actualizarCampo("razon_social", evento.target.value)
                    }
                    className={claseInput(Boolean(errores.razon_social))}
                    placeholder="Comercial Andina S.A.C."
                    aria-invalid={Boolean(errores.razon_social)}
                  />
                </Campo>
              </div>

              <div className="sm:col-span-2">
                <Campo
                  etiqueta="Dirección"
                  htmlFor="cliente-direccion"
                  error={errores.direccion}
                >
                  <input
                    id="cliente-direccion"
                    value={formulario.direccion}
                    onChange={(evento) =>
                      actualizarCampo("direccion", evento.target.value)
                    }
                    className={claseInput(Boolean(errores.direccion))}
                    placeholder="Av. Giraldez 123, Huancayo"
                    aria-invalid={Boolean(errores.direccion)}
                  />
                </Campo>
              </div>

              <Campo
                etiqueta="Correo"
                htmlFor="cliente-correo"
                error={errores.correo}
              >
                <input
                  id="cliente-correo"
                  type="email"
                  value={formulario.correo}
                  onChange={(evento) =>
                    actualizarCampo("correo", evento.target.value)
                  }
                  className={claseInput(Boolean(errores.correo))}
                  placeholder="contacto@andina.pe"
                  aria-invalid={Boolean(errores.correo)}
                />
              </Campo>

              <Campo
                etiqueta="Teléfono"
                htmlFor="cliente-telefono"
                error={errores.telefono}
                ayuda="Opcional, 6 a 15 caracteres."
              >
                <input
                  id="cliente-telefono"
                  type="tel"
                  value={formulario.telefono}
                  onChange={(evento) =>
                    actualizarCampo("telefono", evento.target.value)
                  }
                  className={claseInput(Boolean(errores.telefono))}
                  placeholder="964123456"
                  aria-invalid={Boolean(errores.telefono)}
                />
              </Campo>
            </div>

            {modo === "editar" ? (
              <div className="rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-medium text-slate-700">Estado</p>
                <label className="mt-2 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formulario.estado}
                    onChange={(evento) =>
                      actualizarCampo("estado", evento.target.checked)
                    }
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-11 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2">
                    <span
                      className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        formulario.estado ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {formulario.estado ? "Activo" : "Inactivo"}
                  </span>
                </label>
              </div>
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
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                {guardando
                  ? "Guardando…"
                  : modo === "editar"
                    ? "Guardar cambios"
                    : "Registrar cliente"}
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
          <label htmlFor="buscar-cliente" className="sr-only">
            Buscar cliente
          </label>
          <input
            id="buscar-cliente"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por razón social o RUC…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-9 text-sm text-slate-900 shadow-sm transition-colors duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
          {buscando ? (
            <LoaderCircle
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-emerald-600"
              aria-hidden="true"
            />
          ) : busqueda ? (
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
          {total === 1 ? "cliente encontrado" : "clientes encontrados"}
        </p>
      </div>

      {error ? <BloqueError mensaje={error} onReintentar={recargar} /> : null}

      {cargando ? (
        <SkeletonLista />
      ) : clientes.length === 0 && !error ? (
        <div className="tarjeta-eco px-4 py-12 text-center">
          <Building
            className="mx-auto size-10 text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-4 text-base font-semibold text-slate-900">
            {busqueda
              ? "No se encontraron clientes"
              : "Aún no hay clientes registrados"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {busqueda
              ? "Prueba con otra razón social o RUC."
              : "Registra el primer cliente para comenzar a programar recojos."}
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            {busqueda ? (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Limpiar búsqueda
              </button>
            ) : null}
            <button
              type="button"
              onClick={abrirCrear}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo cliente
            </button>
          </div>
        </div>
      ) : clientes.length > 0 ? (
        <>
          <div className="hidden overflow-hidden tarjeta-eco md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Razón social
                    </th>
                    <th scope="col" className="px-4 py-3">
                      RUC
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Contacto
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Dirección
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
                  {clientes.map((cliente) => (
                    <tr
                      key={cliente.id_cliente}
                      className="transition-colors duration-200 even:bg-slate-50/70 hover:bg-slate-100/80"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {cliente.razon_social}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {cliente.ruc ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">
                          {cliente.correo ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {cliente.telefono ?? "—"}
                        </p>
                      </td>
                      <td className="max-w-56 truncate px-4 py-3 text-slate-600">
                        {cliente.direccion ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={cliente.estado} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => abrirEditar(cliente)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {clientes.map((cliente) => (
              <article
                key={cliente.id_cliente}
                className="tarjeta-eco p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {cliente.razon_social}
                    </p>
                    <p className="font-mono text-xs text-slate-500">
                      RUC {cliente.ruc ?? "—"}
                    </p>
                  </div>
                  <EstadoBadge estado={cliente.estado} />
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Contacto</dt>
                    <dd className="text-slate-700">
                      {cliente.correo ?? "—"}
                      {cliente.telefono ? ` · ${cliente.telefono}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Dirección</dt>
                    <dd className="text-slate-700">
                      {cliente.direccion ?? "—"}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => abrirEditar(cliente)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar cliente
                </button>
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
      ) : null}
    </div>
  );
}
