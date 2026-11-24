import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CircleCheckBig,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  Recycle,
  Route,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { rutaInicialPorRol } from "../utils/roles";
import { useToast } from "../context/ToastContext";
import { mensajeDeError } from "../utils/formatters";
import { validarCorreo, validarRequerido } from "../utils/validaciones";

const BENEFICIOS = [
  "Registro y seguimiento de recojos en tiempo real",
  "Validación de RUC, DNI y placas peruanas",
  "Indicadores operativos y control de flota",
  "Trazabilidad ambiental y reducción de residuos en Huancayo",
];

const METRICAS = [
  {
    Icono: MapPin,
    detalle: "Cobertura",
    valor: "Valle del Mantaro",
    etiqueta: "Zonas de recolección",
  },
  {
    Icono: Route,
    detalle: "Trazabilidad",
    valor: "100%",
    etiqueta: "Control por manifiesto",
  },
  {
    Icono: Recycle,
    detalle: "Residuos",
    valor: "5 categorías",
    etiqueta: "Clasificación y pesaje",
  },
];

const CLASE_ENTRADA =
  "min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const RETARDO_EXITO_MS = 350;

function claseCampo(tieneError) {
  return `group flex items-center gap-2.5 rounded-xl border bg-white px-3.5 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 ${
    tieneError
      ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-400"
      : "border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-500"
  }`;
}

export default function LoginPage() {
  const { login, autenticado, cargando, usuario, rutaInicio } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [faseBoton, setFaseBoton] = useState("inicial");
  const temporizadorExito = useRef(null);

  useEffect(
    () => () => {
      if (temporizadorExito.current) {
        clearTimeout(temporizadorExito.current);
      }
    },
    [],
  );

  const enviando = faseBoton !== "inicial";
  const claseBoton = [
    "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-100",
    faseBoton === "exito"
      ? "bg-emerald-700 shadow-lg shadow-emerald-900/20"
      : "bg-emerald-600 shadow-lg shadow-emerald-900/15 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-900/20 active:translate-y-0",
  ].join(" ");

  const desde = location.state?.from;
  const destinoSolicitado =
    typeof desde === "string" && desde !== "/login" ? desde : null;
  const rolSesion = String(usuario?.rol ?? "").toUpperCase();
  const destino =
    rolSesion === "OPERADOR"
      ? "/mis-recojos"
      : destinoSolicitado ?? rutaInicio;

  function limpiarError(campo) {
    setErrores((anteriores) => {
      if (!anteriores[campo]) return anteriores;
      const siguientes = { ...anteriores };
      delete siguientes[campo];
      return siguientes;
    });
  }

  function cambiarCorreo(valor) {
    setCorreo(valor);
    setErrorGeneral("");
    limpiarError("correo");
  }

  function cambiarPassword(valor) {
    setPassword(valor);
    setErrorGeneral("");
    limpiarError("password");
  }

  function validarFormulario() {
    const siguientes = {};

    const errorCorreo = validarCorreo(correo);
    if (errorCorreo) siguientes.correo = errorCorreo;

    const errorPassword = validarRequerido(
      password,
      "La contraseña es obligatoria.",
    );
    if (errorPassword) siguientes.password = errorPassword;

    setErrores(siguientes);
    return Object.keys(siguientes).length === 0;
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setErrorGeneral("");

    if (!validarFormulario()) {
      toast.error("Revisa los datos de acceso.");
      return;
    }

    setFaseBoton("cargando");

    try {
      const usuarioSesion = await login(correo.trim(), password);
      const nombre =
        usuarioSesion?.nombre_completo ?? usuarioSesion?.correo ?? "usuario";
      toast.success(`Bienvenido, ${nombre}.`);

      const rol = String(usuarioSesion?.rol ?? "").toUpperCase();
      const destinoSesion =
        rol === "OPERADOR"
          ? "/mis-recojos"
          : destinoSolicitado ?? rutaInicialPorRol(rol);

      setFaseBoton("exito");
      await new Promise((resolve) => {
        temporizadorExito.current = setTimeout(() => {
          temporizadorExito.current = null;
          resolve();
        }, RETARDO_EXITO_MS);
      });
      navigate(destinoSesion, { replace: true });
    } catch (error) {
      setFaseBoton("inicial");
      const estado = error?.response?.status;
      let mensaje = mensajeDeError(error);

      if (estado === 401) mensaje = "Credenciales inválidas.";
      if (estado === 403) {
        mensaje = "Usuario inactivo. Contacte al administrador.";
      }

      setErrorGeneral(mensaje);
      toast.error(mensaje);
    }
  }

  if (cargando) {
    return (
      <div className="fondo-login flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <LoaderCircle
            className="size-8 animate-spin text-emerald-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  if (autenticado && faseBoton !== "exito") {
    return <Navigate to={destino} replace />;
  }

  return (
    <div className="fondo-login grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-eco-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="absolute inset-0 bg-linear-to-br from-eco-950 via-eco-900 to-emerald-900"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:52px_52px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:20px_20px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-28 -right-24 size-96 rounded-full bg-emerald-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-teal-300/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/3 left-1/2 size-72 -translate-x-1/2 rounded-full bg-emerald-300/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Recycle className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">
                EcoHuancayo S.A.C.
              </p>
              <p className="text-sm text-emerald-100">
                Gestión de recojo de residuos
              </p>
            </div>
          </div>

          <div className="mt-14 max-w-xl xl:mt-16">
            <p className="text-sm font-semibold tracking-wider text-emerald-200 uppercase">
              Operación sostenible
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Cada recojo cuenta para una ciudad más limpia.
            </h1>
            <p className="mt-5 text-base leading-7 text-emerald-50/90">
              Centraliza clientes, rutas, flota y residuos en una sola
              plataforma diseñada para la operación diaria de Huancayo.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-emerald-50">
              {BENEFICIOS.map((beneficio) => (
                <li key={beneficio} className="flex items-start gap-2.5">
                  <CircleCheckBig
                    className="mt-0.5 size-4 shrink-0 text-emerald-200"
                    aria-hidden="true"
                  />
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-10">
          <div className="rounded-2xl border border-white/15 bg-linear-to-br from-white/15 via-white/10 to-white/5 p-5 shadow-2xl shadow-eco-950/30 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-emerald-200 uppercase">
                  SISTEMA INTEGRADO
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  Alcance operativo
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-100 ring-1 ring-emerald-300/30">
                <span
                  className="size-1.5 animate-pulse rounded-full bg-emerald-300"
                  aria-hidden="true"
                />
                Huancayo • Junín
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {METRICAS.map(({ Icono, detalle, valor, etiqueta }) => (
                <div
                  key={detalle}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-100/80">
                    <Icono
                      className="size-3.5 shrink-0 text-emerald-200"
                      aria-hidden="true"
                    />
                    {detalle}
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-white">
                    {valor}
                  </p>
                  <p className="text-[11px] text-emerald-100/70">{etiqueta}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs text-emerald-100/70">
            EcoHuancayo S.A.C. · Plataforma interna
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-linear-to-br from-emerald-50/70 via-transparent to-amber-50/50 px-4 py-10 sm:px-6 xl:py-14">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-900/10">
              <Recycle className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900">
                EcoHuancayo S.A.C.
              </p>
              <p className="text-sm text-slate-600">
                Gestión de recojo de residuos
              </p>
            </div>
          </div>

          <div className="tarjeta-eco p-7 sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/15">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-emerald-700 uppercase">
                    Portal corporativo
                  </p>
                  <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                    Iniciar sesión
                  </h2>
                </div>
              </div>
              <span className="hidden rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200 sm:inline-flex">
                v1.0
              </span>
            </div>

            <p className="mb-6 mt-4 text-sm leading-6 text-slate-600">
              Ingresa con tu cuenta corporativa para continuar con la operación
              diaria.
            </p>

            {errorGeneral ? (
              <div
                className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 p-3.5 ring-1 ring-red-200"
                role="alert"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm leading-5 text-red-700">{errorGeneral}</p>
              </div>
            ) : null}

            <form onSubmit={manejarEnvio} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="correo"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Correo corporativo
                </label>
                <div className={claseCampo(Boolean(errores.correo))}>
                  <Mail
                    className="size-4 shrink-0 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-600"
                    aria-hidden="true"
                  />
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    autoComplete="username"
                    value={correo}
                    onChange={(evento) => cambiarCorreo(evento.target.value)}
                    placeholder="nombre@ecohuancayo.pe"
                    className={CLASE_ENTRADA}
                    aria-invalid={Boolean(errores.correo)}
                    aria-describedby={
                      errores.correo ? "error-correo" : undefined
                    }
                    disabled={enviando}
                  />
                </div>
                {errores.correo ? (
                  <p id="error-correo" className="mt-1 text-sm text-red-600">
                    {errores.correo}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Contraseña
                </label>
                <div className={claseCampo(Boolean(errores.password))}>
                  <Lock
                    className="size-4 shrink-0 text-slate-400 transition-colors duration-200 group-focus-within:text-emerald-600"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(evento) => cambiarPassword(evento.target.value)}
                    placeholder="Tu contraseña"
                    className={CLASE_ENTRADA}
                    aria-invalid={Boolean(errores.password)}
                    aria-describedby={
                      errores.password ? "error-password" : undefined
                    }
                    disabled={enviando}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((valor) => !valor)}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errores.password ? (
                  <p id="error-password" className="mt-1 text-sm text-red-600">
                    {errores.password}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={enviando}
                className={claseBoton}
              >
                {faseBoton === "inicial" ? (
                  <span
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:animate-ingresar-shimmer group-hover:opacity-100"
                    aria-hidden="true"
                  />
                ) : null}

                {faseBoton === "exito" ? (
                  <CircleCheckBig
                    className="relative z-10 size-4 animate-ingresar-check"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="relative z-10 inline-flex size-4 items-center justify-center">
                    <ArrowRight
                      className={`size-4 ${
                        faseBoton === "cargando"
                          ? "animate-ingresar-arrow-exit"
                          : "transition-transform duration-200 group-hover:translate-x-1.5"
                      }`}
                      aria-hidden="true"
                    />
                    {faseBoton === "cargando" ? (
                      <span
                        className="absolute inset-0 flex animate-ingresar-spinner-in items-center justify-center"
                        aria-hidden="true"
                      >
                        <LoaderCircle className="size-4 animate-spin" />
                      </span>
                    ) : null}
                  </span>
                )}

                <span className="relative z-10" aria-live="polite">
                  {faseBoton === "cargando" ? (
                    <span className="animate-ingresar-texto">
                      Verificando acceso...
                    </span>
                  ) : faseBoton === "exito" ? (
                    <span className="animate-ingresar-texto">
                      ¡Bienvenido!
                    </span>
                  ) : (
                    "Ingresar"
                  )}
                </span>

                {faseBoton === "cargando" ? (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-ingresar-progress bg-white/80"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
                <ShieldCheck
                  className="size-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>
                  Acceso exclusivo para personal autorizado · roles ADMIN y
                  OPERADOR
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
