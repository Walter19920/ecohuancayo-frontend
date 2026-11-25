import { useEffect, useMemo, useState } from "react";
import {
  CircleX,
  KeyRound,
  LoaderCircle,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleExclamationPoint,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  cambiarEstadoUsuario,
  cambiarPasswordUsuario,
  crearUsuario,
  listarUsuarios,
} from "../services/usuarioService";
import { listarEmpleados } from "../services/empleadoService";
import ConfirmModal from "../components/ui/ConfirmModal";
import ModalCambioContrasena from "../components/ui/ModalCambioContrasena";
import { useToast } from "../context/ToastContext";
import {
  claseRol,
  formatearFecha,
  formatearRol,
  mensajeDeError,
  textoEstado,
} from "../utils/formatters";
import { PAGINA_AUXILIAR } from "../utils/paginacion";
import Pagination from "../components/ui/Pagination";
import { validarUsuario } from "../utils/validaciones";

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

function RolBadge({ rol }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${claseRol(rol)}`}
    >
      <ShieldCheck className="size-3.5" aria-hidden="true" />
      {formatearRol(rol)}
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
            No se pudieron cargar los usuarios
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

function formularioVacio() {
  return {
    id_empleado: "",
    correo: "",
    password: "",
    confirmar_password: "",
    rol: "OPERADOR",
  };
}

function CampoPassword({
  id,
  etiqueta,
  valor,
  error,
  onCambiar,
  autoComplete = "new-password",
  deshabilitado = false,
}) {
  return (
    <Campo etiqueta={etiqueta} htmlFor={id} error={error} requerido>
      <input
        id={id}
        type="password"
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value)}
        autoComplete={autoComplete}
        disabled={deshabilitado}
        className={claseInput(Boolean(error))}
        placeholder="Mínimo 8 caracteres"
        aria-invalid={Boolean(error)}
      />
    </Campo>
  );
}

export default function UsuariosPage() {
  const { toast } = useToast();

  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState("");
  const [errorEmpleados, setErrorEmpleados] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [tamanioPagina, setTamanioPagina] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const [modalEstado, setModalEstado] = useState(null);
  const [modalPassword, setModalPassword] = useState(null);

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
      const [resultadoUsuarios, resultadoEmpleados] = await Promise.allSettled([
        listarUsuarios({
          busqueda: busquedaDebounced,
          pagina,
          tamanio_pagina: tamanioPagina,
        }),
        listarEmpleados(PAGINA_AUXILIAR),
      ]);

      if (!activo) return;

      if (resultadoUsuarios.status === "fulfilled") {
        setUsuarios(resultadoUsuarios.value.items);
        setTotal(resultadoUsuarios.value.total);
        setTotalPaginas(resultadoUsuarios.value.total_paginas);
        setError("");
      } else {
        setError(mensajeDeError(resultadoUsuarios.reason));
      }

      if (resultadoEmpleados.status === "fulfilled") {
        setEmpleados(resultadoEmpleados.value.items);
        setErrorEmpleados("");
      } else {
        setErrorEmpleados(mensajeDeError(resultadoEmpleados.reason));
      }

      setCargando(false);
      setRecargando(false);
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [busquedaDebounced, pagina, tamanioPagina, recarga]);

  function recargar() {
    setRecargando(true);
    setRecarga((valor) => valor + 1);
  }

  const empleadosDisponibles = useMemo(() => {
    const idsConUsuario = new Set(
      usuarios.map((usuario) => Number(usuario.id_empleado)),
    );
    return empleados.filter(
      (empleado) => !idsConUsuario.has(Number(empleado.id_empleado)),
    );
  }, [empleados, usuarios]);

  const totalActivos = usuarios.filter(
    (usuario) => usuario.estado !== false,
  ).length;
  const totalInactivos = usuarios.length - totalActivos;

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
  }

  function abrirCrear() {
    setFormulario(formularioVacio());
    setErrores({});
    setModalCrearAbierto(true);
  }

  function cerrarCrear() {
    if (guardando) return;
    setModalCrearAbierto(false);
    setErrores({});
  }

  async function confirmarCrear() {
    if (guardando) return;

    const resultado = validarUsuario(formulario);

    if (!resultado.valido) {
      setErrores(resultado.errores);
      toast.error("Revisa los datos del usuario.");
      return;
    }

    setGuardando(true);

    try {
      await crearUsuario({
        id_empleado: formulario.id_empleado,
        correo: formulario.correo,
        password: formulario.password,
        rol: formulario.rol,
      });
      toast.success("Usuario registrado correctamente.");
      setModalCrearAbierto(false);
      setFormulario(formularioVacio());
      setErrores({});
      recargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  function abrirModalEstado(usuario) {
    setModalEstado({ usuario, guardando: false });
  }

  function cerrarModalEstado() {
    if (modalEstado?.guardando) return;
    setModalEstado(null);
  }

  async function confirmarEstado() {
    if (!modalEstado || modalEstado.guardando) return;

    const { usuario } = modalEstado;
    const nuevoEstado = usuario.estado === false;

    setModalEstado((actual) => ({ ...actual, guardando: true }));

    try {
      await cambiarEstadoUsuario(usuario.id_usuario, nuevoEstado);
      toast.success(
        nuevoEstado
          ? "Usuario activado correctamente."
          : "Usuario desactivado correctamente.",
      );
      setModalEstado(null);
      recargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
      setModalEstado((actual) =>
        actual ? { ...actual, guardando: false } : actual,
      );
    }
  }

  function abrirModalPassword(usuario) {
    setModalPassword({ usuario, guardando: false });
  }

  function cerrarModalPassword() {
    if (modalPassword?.guardando) return;
    setModalPassword(null);
  }

  async function confirmarPassword(nuevaPassword) {
    if (!modalPassword || modalPassword.guardando) return;

    setModalPassword((actual) => ({ ...actual, guardando: true }));

    try {
      await cambiarPasswordUsuario(
        modalPassword.usuario.id_usuario,
        nuevaPassword,
      );
      toast.success("Contraseña actualizada correctamente.");
      setModalPassword(null);
    } catch (err) {
      toast.error(mensajeDeError(err));
      setModalPassword((actual) =>
        actual ? { ...actual, guardando: false } : actual,
      );
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Seguridad</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Administra las cuentas de acceso al sistema y sus credenciales.
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
            <UserPlus className="size-4" aria-hidden="true" />
            Nuevo usuario
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="tarjeta-eco p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Total
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {total.toLocaleString("es-PE")}
          </p>
        </div>
        <div className="tarjeta-eco p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Activos
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {totalActivos}
          </p>
        </div>
        <div className="tarjeta-eco p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Inactivos
          </p>
          <p className="mt-1 text-2xl font-bold text-red-700">
            {totalInactivos}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 tarjeta-eco p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="buscar-usuario" className="sr-only">
            Buscar usuario
          </label>
          <input
            id="buscar-usuario"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre, correo o DNI…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-9 text-sm text-slate-900 shadow-sm transition-colors duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
          {usuarios.length}{" "}
          {usuarios.length === 1
            ? "usuario encontrado"
            : "usuarios encontrados"}
        </p>
      </div>

      {error ? <BloqueError mensaje={error} onReintentar={recargar} /> : null}

      {cargando ? (
        <SkeletonLista />
      ) : usuarios.length === 0 && !error ? (
        <div className="tarjeta-eco px-4 py-12 text-center">
          <Users
            className="mx-auto size-10 text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-4 text-base font-semibold text-slate-900">
            Aún no hay usuarios registrados
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Crea la primera cuenta y vincúlala a un empleado registrado.
          </p>
          <button
            type="button"
            onClick={abrirCrear}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Nuevo usuario
          </button>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="tarjeta-eco px-4 py-12 text-center">
          <Search
            className="mx-auto size-10 text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-4 text-base font-semibold text-slate-900">
            No se encontraron usuarios
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Prueba con otro nombre, correo o DNI.
          </p>
          <button
            type="button"
            onClick={() => setBusqueda("")}
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden tarjeta-eco md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Usuario
                    </th>
                    <th scope="col" className="px-4 py-3">
                      DNI
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Correo
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Rol
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Estado
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Creado
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map((usuario) => (
                    <tr
                      key={usuario.id_usuario}
                      className="transition-colors duration-200 even:bg-slate-50/70 hover:bg-slate-100/80"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {usuario.nombre_completo ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {usuario.dni ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {usuario.correo ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <RolBadge rol={usuario.rol} />
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={usuario.estado} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatearFecha(usuario.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirModalEstado(usuario)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ${
                              usuario.estado !== false
                                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500"
                            }`}
                          >
                            <Power className="size-3.5" aria-hidden="true" />
                            {usuario.estado !== false
                              ? "Desactivar"
                              : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirModalPassword(usuario)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          >
                            <KeyRound className="size-3.5" aria-hidden="true" />
                            Contraseña
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
            {usuarios.map((usuario) => (
              <article
                key={usuario.id_usuario}
                className="tarjeta-eco p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {usuario.nombre_completo ?? "—"}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {usuario.correo ?? "—"}
                    </p>
                    <p className="font-mono text-xs text-slate-500">
                      DNI {usuario.dni ?? "—"}
                    </p>
                  </div>
                  <EstadoBadge estado={usuario.estado} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RolBadge rol={usuario.rol} />
                  <span className="text-xs text-slate-500">
                    Creado el {formatearFecha(usuario.fecha_creacion)}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => abrirModalEstado(usuario)}
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ${
                      usuario.estado !== false
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-500"
                    }`}
                  >
                    <Power className="size-4" aria-hidden="true" />
                    {usuario.estado !== false ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirModalPassword(usuario)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <KeyRound className="size-4" aria-hidden="true" />
                    Cambiar contraseña
                  </button>
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

      <ConfirmModal
        abierto={modalCrearAbierto}
        titulo="Nuevo usuario"
        mensaje="Vincula la cuenta a un empleado y define sus credenciales de acceso."
        confirmarTexto="Registrar usuario"
        cancelarTexto="Cancelar"
        variante="advertencia"
        cargando={guardando}
        onConfirmar={confirmarCrear}
        onCerrar={cerrarCrear}
      >
        <div className="space-y-4">
          {errorEmpleados ? (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <TriangleExclamationPoint
                className="mt-0.5 size-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <p className="text-sm text-amber-800">
                No se pudieron cargar los empleados: {errorEmpleados}
              </p>
            </div>
          ) : null}

          <Campo
            etiqueta="Empleado"
            htmlFor="usuario-empleado"
            error={errores.id_empleado}
            requerido
            ayuda={
              empleadosDisponibles.length === 0
                ? "No hay empleados disponibles sin usuario. Registra uno en Operaciones."
                : "Solo se muestran empleados sin cuenta de acceso."
            }
          >
            <select
              id="usuario-empleado"
              value={formulario.id_empleado}
              onChange={(evento) =>
                actualizarCampo("id_empleado", evento.target.value)
              }
              className={claseInput(Boolean(errores.id_empleado))}
              aria-invalid={Boolean(errores.id_empleado)}
              disabled={guardando}
            >
              <option value="">Selecciona un empleado</option>
              {empleadosDisponibles.map((empleado) => (
                <option key={empleado.id_empleado} value={empleado.id_empleado}>
                  {`${empleado.nombres ?? ""} ${
                    empleado.apellidos ?? ""
                  }`.trim()}{" "}
                  · {empleado.dni ?? "sin DNI"}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            etiqueta="Correo"
            htmlFor="usuario-correo"
            error={errores.correo}
            requerido
          >
            <input
              id="usuario-correo"
              type="email"
              value={formulario.correo}
              onChange={(evento) =>
                actualizarCampo("correo", evento.target.value)
              }
              autoComplete="email"
              className={claseInput(Boolean(errores.correo))}
              placeholder="usuario@ecohuancayo.pe"
              aria-invalid={Boolean(errores.correo)}
              disabled={guardando}
            />
          </Campo>

          <CampoPassword
            id="usuario-password"
            etiqueta="Contraseña"
            valor={formulario.password}
            error={errores.password}
            onCambiar={(valor) => actualizarCampo("password", valor)}
            deshabilitado={guardando}
          />

          <CampoPassword
            id="usuario-confirmar"
            etiqueta="Confirmar contraseña"
            valor={formulario.confirmar_password}
            error={errores.confirmar_password}
            onCambiar={(valor) => actualizarCampo("confirmar_password", valor)}
            deshabilitado={guardando}
          />

          <Campo
            etiqueta="Rol"
            htmlFor="usuario-rol"
            error={errores.rol}
            requerido
          >
            <select
              id="usuario-rol"
              value={formulario.rol}
              onChange={(evento) => actualizarCampo("rol", evento.target.value)}
              className={claseInput(Boolean(errores.rol))}
              aria-invalid={Boolean(errores.rol)}
              disabled={guardando}
            >
              <option value="OPERADOR">Operador</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </Campo>
        </div>
      </ConfirmModal>

      <ConfirmModal
        abierto={Boolean(modalEstado)}
        titulo={
          modalEstado?.usuario?.estado !== false
            ? "Desactivar usuario"
            : "Activar usuario"
        }
        mensaje={
          modalEstado
            ? modalEstado.usuario.estado !== false
              ? `¿Desactivar a ${modalEstado.usuario.nombre_completo}? El usuario no podrá iniciar sesión.`
              : `¿Activar a ${modalEstado.usuario.nombre_completo}? El usuario podrá iniciar sesión nuevamente.`
            : undefined
        }
        confirmarTexto={
          modalEstado?.usuario?.estado !== false ? "Desactivar" : "Activar"
        }
        cancelarTexto="Cancelar"
        variante="peligro"
        cargando={modalEstado?.guardando ?? false}
        onConfirmar={confirmarEstado}
        onCerrar={cerrarModalEstado}
      />

      <ModalCambioContrasena
        key={modalPassword?.usuario?.id_usuario ?? "sin-usuario"}
        abierto={Boolean(modalPassword)}
        usuario={modalPassword?.usuario}
        cargando={modalPassword?.guardando ?? false}
        onGuardar={confirmarPassword}
        onCerrar={cerrarModalPassword}
      />
    </div>
  );
}
