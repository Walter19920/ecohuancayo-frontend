import api from "../api/axiosClient";
import { normalizarPlaca } from "../utils/validaciones";
import {
  normalizarPaginado,
  parametrosPaginados,
} from "../utils/paginacion";

/** GET /flota paginado. Devuelve { items, total, pagina, ... }. */
export async function listarVehiculos(opciones = {}) {
  const { data } = await api.get("/flota", {
    params: parametrosPaginados(opciones),
  });
  return normalizarPaginado(data);
}

/** POST /flota (ADMIN o SUPERVISOR) */
export async function registrarVehiculo(payload) {
  const { data } = await api.post("/flota", {
    id_tipo_vehiculo: Number(payload?.id_tipo_vehiculo),
    placa: normalizarPlaca(payload?.placa),
    capacidad_kg: Number(payload?.capacidad_kg),
  });
  return data;
}
