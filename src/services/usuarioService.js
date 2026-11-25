import api from "../api/axiosClient";
import {
  normalizarPaginado,
  parametrosPaginados,
} from "../utils/paginacion";

/** GET /usuarios paginado (solo ADMIN). Devuelve { items, total, pagina, ... }. */
export async function listarUsuarios(opciones = {}) {
  const { data } = await api.get("/usuarios", {
    params: parametrosPaginados(opciones),
  });
  return normalizarPaginado(data);
}

/** POST /usuarios (solo ADMIN) */
export async function crearUsuario(payload) {
  const { data } = await api.post("/usuarios", {
    id_empleado: Number(payload?.id_empleado),
    correo: String(payload?.correo ?? "").trim(),
    password: String(payload?.password ?? ""),
    rol: String(payload?.rol ?? "OPERADOR").toUpperCase(),
  });
  return data;
}

/** PATCH /usuarios/{id_usuario}/estado (solo ADMIN) */
export async function cambiarEstadoUsuario(idUsuario, estado) {
  const { data } = await api.patch(`/usuarios/${Number(idUsuario)}/estado`, {
    estado: Boolean(estado),
  });
  return data;
}

/** PATCH /usuarios/{id_usuario}/password (solo ADMIN) */
export async function cambiarPasswordUsuario(idUsuario, nuevaPassword) {
  const { data } = await api.patch(`/usuarios/${Number(idUsuario)}/password`, {
    nueva_password: String(nuevaPassword ?? ""),
  });
  return data;
}

/** GET /usuarios/solicitudes-contrasena (solo ADMIN) */
export async function listarSolicitudesContrasena() {
  const { data } = await api.get("/usuarios/solicitudes-contrasena");
  return Array.isArray(data) ? data : [];
}

/** PATCH /usuarios/solicitudes-contrasena/{id}/atender (solo ADMIN) */
export async function atenderSolicitudContrasena(idSolicitud) {
  const { data } = await api.patch(
    `/usuarios/solicitudes-contrasena/${Number(idSolicitud)}/atender`,
  );
  return data;
}
