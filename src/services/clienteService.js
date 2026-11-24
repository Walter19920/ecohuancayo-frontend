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

/** GET /clientes paginado. Devuelve { items, total, pagina, ... }. */
export async function listarClientes(opciones = {}) {
  const { data } = await api.get("/clientes", {
    params: parametrosPaginados(opciones),
  });
  return normalizarPaginado(data);
}

/** POST /clientes */
export async function crearCliente(payload) {
  const { data } = await api.post("/clientes", {
    razon_social: String(payload?.razon_social ?? "").trim(),
    ruc: String(payload?.ruc ?? "").trim(),
    direccion: limpiarTexto(payload?.direccion),
    correo: limpiarTexto(payload?.correo),
    telefono: limpiarTexto(payload?.telefono),
  });
  return data;
}

/** PUT /clientes/{id_cliente} — el RUC no forma parte del contrato de edición. */
export async function actualizarCliente(idCliente, payload) {
  const { data } = await api.put(`/clientes/${Number(idCliente)}`, {
    razon_social: String(payload?.razon_social ?? "").trim(),
    direccion: limpiarTexto(payload?.direccion),
    correo: limpiarTexto(payload?.correo),
    telefono: limpiarTexto(payload?.telefono),
    estado: Boolean(payload?.estado),
  });
  return data;
}
