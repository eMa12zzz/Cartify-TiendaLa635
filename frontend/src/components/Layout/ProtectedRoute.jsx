import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SinPermiso from '../../pages/SinPermiso';

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
/*
 * `soloPersonal` marca las rutas del panel. Es opcional a propósito: el área
 * "Mi Cuenta" tiene que seguir abierta a los dos, porque /mi-cuenta/reparto es
 * la pantalla que usa el repartidor desde su teléfono, en la calle.
 */
const ProtectedRoute = ({ soloPersonal = false }) => {
  const { isAuthenticated, esCliente } = useAuth();
  const { pathname, search } = useLocation();

  /*
   * 1- Sin sesión, al login — pero avisándole a dónde iba.
   *
   * Mandarlo al login y después soltarlo en la portada obliga a volver a
   * buscar lo que estaba haciendo. Con `volver` la sesión lo devuelve al
   * mismo lugar, que es lo único que la persona quería.
   */
  if (!isAuthenticated) {
    return <Navigate to={`/iniciar-sesion?volver=${encodeURIComponent(pathname + search)}`} replace />;
  }

  /*
   * 2- Con sesión, pero de quien no es.
   *
   * Se muestra la explicación EN EL LUGAR, sin redirigir. Redirigir borraría
   * la dirección que la persona escribió y la dejaría sin entender qué pasó;
   * peor, mandarla al login sería mentirle, porque su sesión está perfecta.
   *
   * Pasa de verdad y seguido: la misma persona administra la tienda y es
   * clienta de su propia tienda, con el mismo correo en las dos tablas.
   */
  if (soloPersonal && esCliente) {
    return <SinPermiso />;
  }

  // 3- Todo en orden: renderizamos la ruta hija (AdminLayout y sus páginas)
  return <Outlet />;
};

export default ProtectedRoute;
