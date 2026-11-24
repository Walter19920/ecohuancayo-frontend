import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RecojosPage from "./pages/RecojosPage";
import ClientesPage from "./pages/ClientesPage";
import OperacionesPage from "./pages/OperacionesPage";
import UsuariosPage from "./pages/UsuariosPage";
import MisRecojosPage from "./pages/MisRecojos";

const ROLES_GENERALES = ["ADMIN", "SUPERVISOR"];
const ROLES_ADMIN = ["ADMIN"];
const ROLES_OPERADOR = ["OPERADOR"];

function RedireccionInicio() {
  const { rutaInicio } = useAuth();
  return <Navigate to={rutaInicio} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={ROLES_GENERALES}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recojos"
                  element={
                    <ProtectedRoute allowedRoles={ROLES_GENERALES}>
                      <RecojosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <ProtectedRoute allowedRoles={ROLES_GENERALES}>
                      <ClientesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operaciones"
                  element={
                    <ProtectedRoute allowedRoles={ROLES_GENERALES}>
                      <OperacionesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute allowedRoles={ROLES_ADMIN}>
                      <UsuariosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mis-recojos"
                  element={
                    <ProtectedRoute allowedRoles={ROLES_OPERADOR}>
                      <MisRecojosPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Route>

            <Route path="/" element={<RedireccionInicio />} />
            <Route path="*" element={<RedireccionInicio />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
