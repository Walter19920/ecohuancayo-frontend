/** Utilidades de roles y navegación por perfil. */

/** Ruta de entrada de cada rol después de autenticarse. */
export function rutaInicialPorRol(rol) {
  const valor = String(rol ?? "").toUpperCase();
  if (valor === "OPERADOR") return "/mis-recojos";
  return "/dashboard";
}
