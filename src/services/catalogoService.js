import api from "../api/axiosClient";

/** GET /catalogos — devuelve el JSONB completo de catálogos. */
export async function obtenerCatalogos() {
  const { data } = await api.get("/catalogos");
  return data && typeof data === "object" ? data : {};
}
