import api from "../api/axiosClient";

/** POST /auth/login — devuelve { access_token, token_type, usuario }. */
export async function login(correo, password) {
  const { data } = await api.post("/auth/login", {
    correo: String(correo ?? "").trim(),
    password: String(password ?? ""),
  });
  return data;
}

/** GET /auth/me — revalida el token y devuelve la sesión actual. */
export async function obtenerSesion() {
  const { data } = await api.get("/auth/me");
  return data;
}

/** POST /auth/solicitar-contrasena — público; siempre devuelve { mensaje }. */
export async function solicitarCambioContrasena(correo) {
  const { data } = await api.post("/auth/solicitar-contrasena", {
    correo: String(correo ?? "").trim(),
  });
  return data;
}

/** PATCH /auth/cambiar-password — cambio propio validando la clave actual. */
export async function cambiarMiPassword(passwordActual, nuevaPassword) {
  const { data } = await api.patch("/auth/cambiar-password", {
    password_actual: String(passwordActual ?? ""),
    nueva_password: String(nuevaPassword ?? ""),
  });
  return data;
}
