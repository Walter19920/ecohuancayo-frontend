import api from "../api/axiosClient";
import { horaParaPayload } from "../utils/formatters";
import {
  normalizarPaginado,
  parametrosPaginados,
} from "../utils/paginacion";

function construirPayload(payload = {}) {
  const residuos = Array.isArray(payload.residuos) ? payload.residuos : [];
  const empleados = Array.isArray(payload.empleados) ? payload.empleados : [];

  return {
    id_vehiculo: Number(payload.id_vehiculo),
    id_centro_reciclaje: Number(payload.id_centro_reciclaje),
    id_cliente: Number(payload.id_cliente),
    id_estado_recojo: Number(payload.id_estado_recojo),
    fecha_recojo: String(payload.fecha_recojo ?? ""),
    hora_recojo: horaParaPayload(payload.hora_recojo),
    residuos: residuos.map((residuo) => ({
      id_tipo_residuo: Number(residuo?.id_tipo_residuo),
      peso_kg: Number(residuo?.peso_kg),
    })),
    empleados: empleados.map((empleado) => ({
      id_empleado: Number(
        typeof empleado === "object" ? empleado?.id_empleado : empleado,
      ),
    })),
  };
}

/** GET /recojos paginado. Devuelve { items, total, pagina, ... }. */
export async function listarRecojos(opciones = {}) {
  const { data } = await api.get("/recojos", {
    params: parametrosPaginados(opciones),
  });
  return normalizarPaginado(data);
}

/** GET /recojos/mis-recojos paginado (panel del operador). */
export async function listarMisRecojos(opciones = {}) {
  const { data } = await api.get("/recojos/mis-recojos", {
    params: parametrosPaginados(opciones),
  });
  return normalizarPaginado(data);
}

/** POST /recojos */
export async function registrarRecojo(payload) {
  const { data } = await api.post("/recojos", construirPayload(payload));
  return data;
}

/** PATCH /recojos/{id_recojo}/estado */
export async function actualizarEstadoRecojo(idRecojo, idEstadoRecojo) {
  const { data } = await api.patch(`/recojos/${Number(idRecojo)}/estado`, {
    id_estado_recojo: Number(idEstadoRecojo),
  });
  return data;
}
