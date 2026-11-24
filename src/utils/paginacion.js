/** Utilidades compartidas para la paginación real del lado del servidor. */

export const TAMANIOS_PAGINA = [5, 10, 20];

/** Tamaño grande para los selects de formularios (no se paginan en la UI). */
export const PAGINA_AUXILIAR = Object.freeze({ pagina: 1, tamanio_pagina: 100 });

const VALORES_POR_DEFECTO = Object.freeze({
  items: [],
  total: 0,
  pagina: 1,
  tamanio_pagina: 5,
  total_paginas: 0,
});

/** Normaliza la respuesta paginada del backend ante cualquier forma inesperada. */
export function normalizarPaginado(data) {
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];
  const total = Number(data?.total ?? items.length) || 0;
  const pagina = Number(data?.pagina) || 1;
  const tamanio_pagina = Number(data?.tamanio_pagina) || VALORES_POR_DEFECTO.tamanio_pagina;
  const total_paginas =
    Number(
      data?.total_paginas ?? Math.ceil(total / tamanio_pagina),
    ) || 0;

  return { items, total, pagina, tamanio_pagina, total_paginas };
}

/** Construye los parámetros de consulta comunes de los listados paginados. */
export function parametrosPaginados({
  pagina = 1,
  tamanio_pagina = 5,
  busqueda = "",
  id_estado = null,
} = {}) {
  const params = {
    pagina: Number(pagina) || 1,
    tamanio_pagina: Number(tamanio_pagina) || 5,
  };
  const texto = String(busqueda ?? "").trim();
  if (texto) params.busqueda = texto;
  if (id_estado !== null && id_estado !== undefined && id_estado !== "") {
    params.id_estado = Number(id_estado);
  }
  return params;
}

export const PAGINADO_VACIO = Object.freeze({ ...VALORES_POR_DEFECTO, items: [] });
