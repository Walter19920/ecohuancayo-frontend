import api from "../api/axiosClient";
import {
  normalizarPaginado,
  parametrosPaginados,
} from "../utils/paginacion";

function limpiarTexto(valor) {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

/** GET /empleados paginado. Devuelve { items, total, pagina, ... }. */
export async function listarEmpleados(opciones = {}) {
  const { data } = await api.get("/empleados", {
    params: parametrosPaginados(opciones),
  });
  return normalizarPaginado(data);
}

/** POST /empleados (ADMIN o SUPERVISOR) */
export async function registrarEmpleado(payload) {
  const { data } = await api.post("/empleados", {
    nombres: String(payload?.nombres ?? "").trim(),
    apellidos: String(payload?.apellidos ?? "").trim(),
    dni: String(payload?.dni ?? "").trim(),
    telefono: limpiarTexto(payload?.telefono),
    id_cargo: Number(payload?.id_cargo),
  });
  return data;
}

/** POST /empleados/{id_empleado}/cargo (solo ADMIN) */
export async function asignarCargo(idEmpleado, idCargo) {
  const { data } = await api.post(`/empleados/${Number(idEmpleado)}/cargo`, {
    id_cargo: Number(idCargo),
  });
  return data;
}

/** GET /empleados/{id_empleado}/historial */
export async function obtenerHistorialCargos(idEmpleado) {
  const { data } = await api.get(`/empleados/${Number(idEmpleado)}/historial`);
  return Array.isArray(data) ? data : [];
}

/** GET /empleados/{id_empleado}/recojos */
export async function obtenerHistorialRecojosEmpleado(idEmpleado) {
  const { data } = await api.get(`/empleados/${Number(idEmpleado)}/recojos`);
  return Array.isArray(data) ? data : [];
}
