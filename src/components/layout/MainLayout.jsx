import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Building,
  ChevronRight,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Recycle,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotificaciones } from "../../context/NotificacionesContext";
import { useToast } from "../../context/ToastContext";
import ModalCambioContrasena from "../ui/ModalCambioContrasena";
import ModalCambioMiPassword from "../ui/ModalCambioMiPassword";
import {
  claseRol,
  formatearFecha,
  formatearHora,
  formatearRol,
  iniciales,
  mensajeDeError,
} from "../../utils/formatters";

const NAVEGACION = [
  {
    ruta: "/dashboard",
    etiqueta: "Dashboard",
    Icono: LayoutDashboard,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    ruta: "/recojos",
    etiqueta: "Recojos",
    Icono: Truck,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    ruta: "/clientes",
    etiqueta: "Clientes",
    Icono: Building,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    ruta: "/operaciones",
    etiqueta: "Operaciones",
    Icono: Wrench,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    ruta: "/usuarios",
    etiqueta: "Usuarios",
    Icono: Users,
    roles: ["ADMIN"],
  },
  {
    ruta: "/mis-recojos",
    etiqueta: "Mis recojos",
    Icono: ClipboardList,
    roles: ["OPERADOR"],
  },
];

const TITULOS = {
  "/dashboard": "Dashboard",
  "/recojos": "Recojos",
  "/clientes": "Clientes",
  "/operaciones": "Operaciones",
  "/usuarios": "Usuarios",
  "/mis-recojos": "Mis recojos",
};

function horaSolicitud(valor) {
  const texto = String(valor ?? "");
  return formatearHora(texto.length > 10 ? texto.slice(11) : texto);
}

const ROLES_CON_CAMBIO_PASSWORD = ["ADMIN", "SUPERVISOR", "OPERADOR"];

export default function MainLayout() {
  const { usuario, logout, rol, cambiarMiPassword } = useAuth();
  const { toast } = useToast();
  const {
    solicitudes,
    cambioSolicitud,
    abrirCambio,
    cerrarCambio,
    guardarClave: guardarClaveSolicitud,
  } = useNotificaciones();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [panelNotificaciones, setPanelNotificaciones] = useState(false);
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [modalMiPassword, setModalMiPassword] = useState(false);

  const items = NAVEGACION.filter((item) => item.roles.includes(rol));
  const titulo = TITULOS[location.pathname] ?? "EcoHuancayo";
  const nombre = usuario?.nombre_completo ?? usuario?.correo ?? "Usuario";
  const totalSolicitudes = solicitudes.length;

  function cerrarSesion() {
    logout();
    toast.info("Sesión cerrada");
    setMenuAbierto(false);
    setPanelNotificaciones(false);
    navigate("/login", { replace: true });
  }

  async function guardarClave(nuevaPassword) {
    if (!cambioSolicitud || guardandoClave) return;

    setGuardandoClave(true);
    try {
      await guardarClaveSolicitud(cambioSolicitud, nuevaPassword);
      cerrarCambio();
      setPanelNotificaciones(false);
    } catch (error) {
      toast.error(mensajeDeError(error));
    } finally {
      setGuardandoClave(false);
    }
  }

  async function guardarMiPassword(passwordActual, nuevaPassword) {
    await cambiarMiPassword(passwordActual, nuevaPassword);
    toast.success("Contraseña actualizada correctamente");
  }

  return (
    <div className="fondo-eco min-h-screen">
      {menuAbierto ? (
        <button
          type="button"
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-30 cursor-default bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-label="Cerrar menú"
        />
      ) : null}

      <aside
        id="sidebar-principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-eco-400/25 bg-linear-to-b from-eco-950 via-eco-900 to-eco-800 shadow-2xl shadow-eco-950/40 transition-transform duration-300 ease-out lg:translate-x-0 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-eco-400/20 px-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-eco-300 via-eco-400 to-eco-cyan text-eco-950 shadow-lg shadow-eco-950/40">
              <Recycle className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-white">
                EcoHuancayo
              </p>
              <p className="text-[11px] font-semibold tracking-wider text-eco-300 uppercase">
                S.A.C.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuAbierto(false)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-eco-200 transition-colors duration-200 hover:bg-eco-400/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-300 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav
          className="scrollbar-slim flex-1 overflow-y-auto px-3 py-4"
          aria-label="Navegación principal"
        >
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-eco-300/70 uppercase">
            {rol === "OPERADOR" ? "Operación" : "Gestión"}
          </p>

          <div className="flex flex-col gap-1">
            {items.map(({ ruta, etiqueta, Icono }) => (
              <NavLink
                key={ruta}
                to={ruta}
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-300 ${
                    isActive
                      ? "bg-emerald-500/15 text-white ring-1 ring-emerald-400/25"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icono
                      className={`size-5 shrink-0 ${
                        isActive
                          ? "text-emerald-300"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{etiqueta}</span>
                    {isActive ? (
                      <ChevronRight
                        className="size-4 text-emerald-300"
                        aria-hidden="true"
                      />
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-eco-400/20 p-4">
          <div className="rounded-xl bg-eco-950/50 p-3 ring-1 ring-eco-400/20">
            <p className="text-[11px] font-semibold tracking-wider text-eco-300/70 uppercase">
              Sesión
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {nombre}
            </p>
            <p
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${claseRol(rol)}`}
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {formatearRol(rol)}
            </p>
          </div>
          <p className="mt-3 text-center text-[11px] text-eco-200/60">
            EcoHuancayo S.A.C. · v1.0
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuAbierto((valor) => !valor)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 lg:hidden"
                aria-controls="sidebar-principal"
                aria-expanded={menuAbierto}
                aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              >
                {menuAbierto ? (
                  <X className="size-5" aria-hidden="true" />
                ) : (
                  <Menu className="size-5" aria-hidden="true" />
                )}
              </button>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Panel de control
                </p>
                <h1 className="truncate text-lg font-semibold text-slate-900">
                  {titulo}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {rol === "ADMIN" ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setPanelNotificaciones((valor) => !valor)
                    }
                    aria-label={`Notificaciones${
                      totalSolicitudes > 0
                        ? `, ${totalSolicitudes} solicitudes pendientes`
                        : ""
                    }`}
                    aria-expanded={panelNotificaciones}
                    className="relative inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <Bell className="size-5" aria-hidden="true" />
                    {totalSolicitudes > 0 ? (
                      <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white ring-2 ring-white">
                        {totalSolicitudes}
                      </span>
                    ) : null}
                  </button>

                  {panelNotificaciones ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPanelNotificaciones(false)}
                        className="fixed inset-0 z-30 cursor-default"
                        aria-label="Cerrar notificaciones"
                      />

                      <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
                        <div className="border-b border-slate-100 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">
                            Solicitudes de contraseña
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {totalSolicitudes === 1
                              ? "1 solicitud pendiente"
                              : `${totalSolicitudes} solicitudes pendientes`}
                          </p>
                        </div>

                        <div className="scrollbar-slim max-h-96 overflow-y-auto p-2">
                          {totalSolicitudes === 0 ? (
                            <p className="px-3 py-6 text-center text-sm text-slate-500">
                              No hay solicitudes pendientes.
                            </p>
                          ) : (
                            solicitudes.map((solicitud) => (
                              <article
                                key={solicitud.id_solicitud}
                                className="rounded-xl p-3 transition-colors duration-200 hover:bg-slate-50"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {solicitud.nombre_completo ?? "—"}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                      {solicitud.correo}
                                    </p>
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${claseRol(solicitud.rol)}`}
                                  >
                                    {formatearRol(solicitud.rol)}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formatearFecha(solicitud.fecha_solicitud)} ·{" "}
                                  {horaSolicitud(solicitud.fecha_solicitud)}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => {
                                    abrirCambio(solicitud);
                                    setPanelNotificaciones(false);
                                  }}
                                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                  <KeyRound className="size-3.5" aria-hidden="true" />
                                  Asignar nueva clave
                                </button>
                              </article>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}

              {ROLES_CON_CAMBIO_PASSWORD.includes(rol) ? (
                <button
                  type="button"
                  onClick={() => setModalMiPassword(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label="Cambiar mi contraseña"
                >
                  <KeyRound className="size-4" aria-hidden="true" />
                  <span className="hidden md:inline">Cambiar mi contraseña</span>
                </button>
              ) : null}

              <span
                className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 sm:inline-flex ${claseRol(rol)}`}
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {formatearRol(rol)}
              </span>

              <div className="hidden text-right sm:block">
                <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
                  {nombre}
                </p>
                <p className="max-w-40 truncate text-xs text-slate-500">
                  {usuario?.correo}
                </p>
              </div>

              <div
                className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-500 text-sm font-semibold text-white ring-2 ring-white"
                aria-hidden="true"
              >
                {iniciales(nombre)}
              </div>

              <button
                type="button"
                onClick={cerrarSesion}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                aria-label="Cerrar sesión"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        <main
          id="contenido-principal"
          className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <ModalCambioContrasena
        key={cambioSolicitud?.id_solicitud ?? "sin-solicitud"}
        abierto={Boolean(cambioSolicitud)}
        usuario={cambioSolicitud}
        cargando={guardandoClave}
        onGuardar={guardarClave}
        onCerrar={() => {
          if (!guardandoClave) cerrarCambio();
        }}
      />

      <ModalCambioMiPassword
        key={modalMiPassword ? "mi-password-abierta" : "mi-password-cerrada"}
        abierto={modalMiPassword}
        onGuardar={guardarMiPassword}
        onCerrar={() => setModalMiPassword(false)}
      />
    </div>
  );
}
