/**
 * Utilidades de formato y normalización de datos del backend.
 * No dependen de React ni de Axios.
 */

const LOCALE = "es-PE";

export const CLAVES_CATALOGO = [
  "distritos",
  "cargos",
  "tipos_vehiculo",
  "tipos_residuo",
  "estados_recojo",
  "centros_reciclaje",
];

export const CATALOGOS_VACIOS = Object.freeze({
  distritos: [],
  cargos: [],
  tipos_vehiculo: [],
  tipos_residuo: [],
  estados_recojo: [],
  centros_reciclaje: [],
});

/** Formatea una fecha AAAA-MM-DD (o ISO) como DD/MM/AAAA sin desfase de zona. */
export function formatearFecha(valor) {
  if (!valor) return "—";
  const texto = String(valor).slice(0, 10);
  const [anio, mes, dia] = texto.split("-");
  if (!anio || !mes || !dia) return String(valor);
  return `${dia}/${mes}/${anio}`;
}

/** Formatea una hora HH:mm:ss como HH:mm. */
export function formatearHora(valor) {
  if (!valor) return "—";
  const [horas = "00", minutos = "00"] = String(valor).split(":");
  return `${horas.padStart(2, "0")}:${minutos.padStart(2, "0")}`;
}

/** Formatea una fecha-hora ISO con Intl. */
export function formatearFechaHora(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}

/** Formatea un número con separadores locales. */
export function formatearNumero(valor, opciones = {}) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: 2,
    ...opciones,
  }).format(numero);
}

/** Formatea un peso en kilogramos con 2 decimales (ej. "1 580,75 kg"). */
export function formatearKg(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return `${new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero)} kg`;
}

/**
 * Extrae un mensaje legible de un error HTTP (Axios) sin exponer detalles internos.
 * Mantiene el mismo criterio que `getApiError` de la capa api, para que las páginas
 * no necesiten importar `api/axiosClient.js`.
 */
export function mensajeDeError(error) {
  if (!error) return "Ocurrió un error inesperado.";

  const datos = error.response?.data;

  if (typeof datos === "string" && datos.trim()) return datos.trim();

  const detalle = datos?.detail;

  if (Array.isArray(detalle)) {
    const mensajes = detalle
      .map((item) => item?.msg ?? String(item ?? ""))
      .filter(Boolean);
    if (mensajes.length > 0) return mensajes.join(". ");
  }

  if (typeof detalle === "string" && detalle.trim()) return detalle.trim();

  if (error.code === "ERR_NETWORK" || !error.response) {
    return "No se pudo conectar con el servidor. Intente nuevamente.";
  }

  return error.message || "Ocurrió un error inesperado.";
}

/** Formatea un monto en soles peruanos. */
export function formatearMoneda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(numero);
}

/** Convierte HH:mm a HH:mm:ss para el contrato del backend. */
export function horaParaPayload(valor) {
  if (!valor) return "";
  const [horas = "00", minutos = "00", segundos = "00"] = String(valor).split(":");
  return `${horas.padStart(2, "0")}:${minutos.padStart(2, "0")}:${segundos
    .padStart(2, "0")
    .slice(0, 2)}`;
}

/** Devuelve AAAA-MM-DD listo para un input type="date". */
export function fechaParaInput(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}

/**
 * Normaliza un ítem de catálogo a `{ id, nombre }`.
 * Tolera las variantes de clave que puede devolver fn_listar_catalogos.
 */
export function normalizarOpcion(item) {
  if (!item || typeof item !== "object") return null;

  const id =
    item.id ??
    item.id_distrito ??
    item.id_cargo ??
    item.id_tipo_vehiculo ??
    item.id_tipo_residuo ??
    item.id_estado_recojo ??
    item.id_centro_reciclaje ??
    item.value ??
    item.codigo ??
    null;

  if (id === null || id === undefined || id === "") return null;

  const nombre =
    item.nombre ??
    item.nombre_centro ??
    item.nombre_estado_recojo ??
    item.nombre_tipo_residuo ??
    item.name ??
    item.descripcion ??
    item.label ??
    String(id);

  const idNumerico = Number(id);

  return {
    ...item,
    id: Number.isFinite(idNumerico) ? idNumerico : id,
    nombre: String(nombre),
  };
}

/** Normaliza una lista de catálogo. */
export function normalizarCatalogo(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map(normalizarOpcion).filter(Boolean);
}

/** Normaliza la respuesta completa de GET /catalogos. */
export function normalizarCatalogos(catalogos) {
  const origen = catalogos && typeof catalogos === "object" ? catalogos : {};
  return CLAVES_CATALOGO.reduce((resultado, clave) => {
    resultado[clave] = normalizarCatalogo(origen[clave]);
    return resultado;
  }, {});
}

/** Obtiene y normaliza una lista concreta de catálogos. */
export function obtenerOpciones(catalogos, clave) {
  return normalizarCatalogo(catalogos?.[clave]);
}

/** Busca el nombre de una opción por id. */
export function nombreDeOpcion(lista, id) {
  const opcion = normalizarCatalogo(lista).find(
    (item) => String(item.id) === String(id),
  );
  return opcion?.nombre ?? "—";
}

/** Iniciales para avatares (máximo 2 letras). */
export function iniciales(nombre) {
  const partes = String(nombre ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return "US";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

/** Etiqueta legible para un rol del backend. */
export function formatearRol(rol) {
  const valor = String(rol ?? "").toUpperCase();
  if (valor === "ADMIN" || valor === "ADMINISTRADOR") return "Administrador";
  if (valor === "SUPERVISOR") return "Supervisor";
  if (valor === "OPERADOR") return "Operador";
  if (valor === "EMPLEADO") return "Empleado";
  return valor || "—";
}

/** Clases de color corporativas para la insignia de cada rol. */
export function claseRol(rol) {
  const valor = String(rol ?? "").toUpperCase();
  if (valor === "ADMIN" || valor === "ADMINISTRADOR") {
    return "bg-indigo-100 text-indigo-700 ring-indigo-200";
  }
  if (valor === "SUPERVISOR") return "bg-sky-100 text-sky-700 ring-sky-200";
  if (valor === "OPERADOR") return "bg-amber-100 text-amber-800 ring-amber-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

/** Etiqueta legible para un booleano de estado. */
export function textoEstado(estado) {
  return estado ? "Activo" : "Inactivo";
}
