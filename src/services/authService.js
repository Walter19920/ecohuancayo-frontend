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
