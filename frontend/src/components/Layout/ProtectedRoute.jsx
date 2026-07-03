import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/*
 * ============================================================
 * COMPONENTE DE RUTA PROTEGIDA — ProtectedRoute.jsx
 * ============================================================
 * Este componente actúa como un "guardia de seguridad" para
 * las rutas del Panel Administrativo.
 *
 * ¿Cómo funciona?
 *  1. Obtiene del contexto si el usuario tiene una sesión activa.
 *  2. Si NO está autenticado, lo redirige a "/" (login de clientes)
 *     usando <Navigate replace /> para que no pueda volver atrás.
 *  3. Si SÍ está autenticado, renderiza <Outlet />, que es el
 *     marcador de posición donde React Router coloca la ruta hija
 *     (por ejemplo: AdminLayout → AdminDashboard).
 *
 * En App.jsx se usa así:
 *   <Route element={<ProtectedRoute />}>
 *     <Route element={<AdminLayout />}>
 *       <Route path="/dashboard" element={<AdminDashboard />} />
 *     </Route>
 *   </Route>
 * ============================================================
 */
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  // 1- Si el usuario no está autenticado, lo mandamos al login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 2- Si está autenticado, renderizamos la ruta hija (AdminLayout y sus páginas)
  return <Outlet />;
};

export default ProtectedRoute;
