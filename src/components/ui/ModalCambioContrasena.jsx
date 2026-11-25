import { useId, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { validarPassword } from "../../utils/validaciones";

const CLASE_ENTRADA =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100";

export default function ModalCambioContrasena({
  abierto = false,
  usuario,
  cargando = false,
  onGuardar,
  onCerrar,
}) {
  const idPassword = useId();
  const idConfirmar = useId();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errores, setErrores] = useState({});

  function reiniciar() {
    setPassword("");
    setConfirmar("");
    setErrores({});
  }

  function cerrar() {
    reiniciar();
    onCerrar?.();
  }

  function cambiarCampo(campo, valor) {
    if (campo === "password") setPassword(valor);
    else setConfirmar(valor);

    setErrores((actuales) => {
      if (!actuales[campo]) return actuales;
      const siguientes = { ...actuales };
      delete siguientes[campo];
      return siguientes;
    });
  }

  function confirmarCambio() {
    const siguientes = {};
    const errorPassword = validarPassword(password);
    if (errorPassword) siguientes.password = errorPassword;

    if (!confirmar) siguientes.confirmar = "Confirma la contraseña.";
    else if (confirmar !== password) {
      siguientes.confirmar = "Las contraseñas no coinciden.";
    }

    setErrores(siguientes);
    if (Object.keys(siguientes).length > 0) return;

    onGuardar(password);
    reiniciar();
  }

  return (
    <ConfirmModal
      abierto={abierto}
      titulo="Cambiar contraseña"
      mensaje={
        usuario
          ? `Define una nueva contraseña para ${usuario.nombre_completo ?? usuario.correo ?? "el usuario"}.`
          : undefined
      }
      confirmarTexto="Cambiar contraseña"
      cancelarTexto="Cancelar"
      variante="advertencia"
      cargando={cargando}
      onConfirmar={confirmarCambio}
      onCerrar={cerrar}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor={idPassword}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Nueva contraseña <span className="text-red-600">*</span>
          </label>
          <input
            id={idPassword}
            type="password"
            value={password}
            onChange={(evento) => cambiarCampo("password", evento.target.value)}
            autoComplete="new-password"
            disabled={cargando}
            placeholder="Mínimo 8 caracteres"
            className={`${CLASE_ENTRADA} ${
              errores.password
                ? "border-red-400 focus-visible:ring-red-400"
                : "border-slate-200 focus-visible:ring-emerald-500"
            }`}
            aria-invalid={Boolean(errores.password)}
          />
          {errores.password ? (
            <p className="mt-1 text-sm text-red-600">{errores.password}</p>
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
            onChange={(evento) => cambiarCampo("confirmar", evento.target.value)}
            autoComplete="new-password"
            disabled={cargando}
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
      </div>
    </ConfirmModal>
  );
}
