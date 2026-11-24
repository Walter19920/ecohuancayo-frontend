import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Protege rutas autenticadas y, opcionalmente, restringe por rol.
 * Uso: <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />} />
 */
export default function ProtectedRoute({ allowedRoles = null, children }) {
  const { autenticado, cargando, usuario, rutaInicio } = useAuth();
  const location = useLocation();

  const rol = String(usuario?.rol ?? "").trim().toUpperCase();
  const rolesPermitidos =
    Array.isArray(allowedRoles) && allowedRoles.length > 0
      ? allowedRoles.map((item) => String(item).trim().toUpperCase())
      : null;
  const sinPermiso = Boolean(
    autenticado && rolesPermitidos && !rolesPermitidos.includes(rol),
  );

  if (cargando) {
    return (
      <div className="fondo-eco flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <LoaderCircle
            className="size-8 animate-spin text-emerald-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (sinPermiso) {
    return <Navigate to={rutaInicio} replace />;
  }

  return children ?? <Outlet />;
}
