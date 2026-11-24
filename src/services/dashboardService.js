import api from "../api/axiosClient";

/** GET /dashboard/indicadores */
export async function obtenerIndicadores() {
  const { data } = await api.get("/dashboard/indicadores");
  return data;
}

/** GET /dashboard/kg-por-tipo-residuo */
export async function obtenerKgPorTipoResiduo() {
  const { data } = await api.get("/dashboard/kg-por-tipo-residuo");
  return Array.isArray(data) ? data : [];
}
