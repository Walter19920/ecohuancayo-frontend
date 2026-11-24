import api from "../api/axiosClient";

function normalizarRespuesta(data) {
  const respuesta = data && typeof data === "object" ? data : {};
  return {
    ...respuesta,
    manual: respuesta.manual === true,
    mensaje: respuesta.mensaje ?? null,
  };
}

/** GET /externo/clima-huancayo — puede responder con manual: true. */
export async function consultarClimaHuancayo() {
  const { data } = await api.get("/externo/clima-huancayo");
  return normalizarRespuesta(data);
}

/** GET /externo/ruc/{ruc} — SUNAT; puede responder con manual: true. */
export async function consultarRuc(ruc) {
  const { data } = await api.get(
    `/externo/ruc/${encodeURIComponent(String(ruc ?? "").trim())}`,
  );
  return normalizarRespuesta(data);
}

/** GET /externo/dni/{dni} — RENIEC; puede responder con manual: true. */
export async function consultarDni(dni) {
  const { data } = await api.get(
    `/externo/dni/${encodeURIComponent(String(dni ?? "").trim())}`,
  );
  return normalizarRespuesta(data);
}
