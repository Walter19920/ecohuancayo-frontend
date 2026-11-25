import { useId, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { mensajeDeError } from "../../utils/formatters";
import { validarPassword } from "../../utils/validaciones";

const CLASE_ENTRADA =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100";

export default function ModalCambioMiPassword({
  abierto = false,
  onGuardar,
  onCerrar,
}) {
  const idActual = useId();
  const idNueva = useId();
  const idConfirmar = useId();
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  function reiniciar() {
    setPasswordActual("");
    setNuevaPassword("");
    setConfirmar("");
    setErrores({});
    setErrorGeneral("");
    setEnviando(false);
    setConfirmado(false);
  }

  function cerrar() {
    if (enviando) return;
    reiniciar();
    onCerrar?.();
  }

  function cambiarCampo(campo, valor) {
    if (campo === "actual") setPasswordActual(valor);
    else if (campo === "nueva") setNuevaPassword(valor);
    else setConfirmar(valor);

    setErrores((actuales) => {
      if (!actuales[campo]) return actuales;
      const siguientes = { ...actuales };
      delete siguientes[campo];
      return siguientes;
    });
  }

  async function confirmarCambio() {
    if (enviando || confirmado) return;

    const siguientes = {};
    if (!passwordActual) {
      siguientes.actual = "Ingresa tu contraseña actual.";
    }

    const errorNueva = validarPassword(nuevaPassword);
    if (errorNueva) siguientes.nueva = errorNueva;

    if (!confirmar) siguientes.confirmar = "Confirma la contraseña.";
    else if (confirmar !== nuevaPassword) {
      siguientes.confirmar = "Las contraseñas no coinciden.";
    }

    setErrores(siguientes);
    setErrorGeneral("");
    if (Object.keys(siguientes).length > 0) return;

    setEnviando(true);
    try {
      await onGuardar(passwordActual, nuevaPassword);
      setConfirmado(true);
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ConfirmModal
      abierto={abierto}
      titulo="Cambiar mi contraseña"
      mensaje={
        confirmado
          ? undefined
          : "Ingresa tu contraseña actual y define una nueva."
      }
      confirmarTexto={confirmado ? "Cerrar" : "Cambiar contraseña"}
      cancelarTexto="Cancelar"
      variante="advertencia"
      cargando={enviando}
      onConfirmar={confirmado ? cerrar : confirmarCambio}
      onCerrar={cerrar}
    >
      {confirmado ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200"
        >
          Contraseña actualizada correctamente.
        </div>
      ) : (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            confirmarCambio();
          }}
          className="space-y-4"
        >
          {errorGeneral ? (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200"
            >
              {errorGeneral}
            </div>
          ) : null}

          <div>
            <label
              htmlFor={idActual}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Contraseña actual <span className="text-red-600">*</span>
            </label>
            <input
              id={idActual}
              type="password"
              value={passwordActual}
              onChange={(evento) =>
                cambiarCampo("actual", evento.target.value)
              }
              autoComplete="current-password"
              disabled={enviando}
              className={`${CLASE_ENTRADA} ${
                errores.actual
                  ? "border-red-400 focus-visible:ring-red-400"
                  : "border-slate-200 focus-visible:ring-emerald-500"
              }`}
              aria-invalid={Boolean(errores.actual)}
            />
            {errores.actual ? (
              <p className="mt-1 text-sm text-red-600">{errores.actual}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={idNueva}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Nueva contraseña <span className="text-red-600">*</span>
            </label>
            <input
              id={idNueva}
              type="password"
              value={nuevaPassword}
              onChange={(evento) => cambiarCampo("nueva", evento.target.value)}
              autoComplete="new-password"
              disabled={enviando}
              placeholder="Mínimo 8 caracteres"
              className={`${CLASE_ENTRADA} ${
                errores.nueva
                  ? "border-red-400 focus-visible:ring-red-400"
                  : "border-slate-200 focus-visible:ring-emerald-500"
              }`}
              aria-invalid={Boolean(errores.nueva)}
            />
            {errores.nueva ? (
              <p className="mt-1 text-sm text-red-600">{errores.nueva}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={idConfirmar}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Confirmar contraseña <span className="text-red-600">*</span>
            </label>
            <input
              id={idConfirmar}
              type="password"
              value={confirmar}
              onChange={(evento) =>
                cambiarCampo("confirmar", evento.target.value)
              }
              autoComplete="new-password"
              disabled={enviando}
              placeholder="Repite la contraseña"
              className={`${CLASE_ENTRADA} ${
                errores.confirmar
                  ? "border-red-400 focus-visible:ring-red-400"
                  : "border-slate-200 focus-visible:ring-emerald-500"
              }`}
              aria-invalid={Boolean(errores.confirmar)}
            />
            {errores.confirmar ? (
              <p className="mt-1 text-sm text-red-600">{errores.confirmar}</p>
            ) : null}
          </div>
        </form>
      )}
    </ConfirmModal>
  );
}
