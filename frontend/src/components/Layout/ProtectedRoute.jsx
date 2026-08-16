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
const ProtectedRoute = ({ soloPersonal = false, soloAdmin = false }) => {
  const { isAuthenticated, esCliente, haySesionDeCliente, user } = useAuth();
  const { pathname, search } = useLocation();

  /*
   * 1- Sin sesión de esta área.
   *
   * Hay dos maneras muy distintas de llegar aquí y merecen respuestas
   * distintas:
   *
   *   a) No ha entrado por ningún lado → al login, avisándole a dónde iba.
   *      Sin el `volver`, la sesión lo suelta en la portada y le toca buscar
   *      otra vez lo que estaba haciendo.
   *
   *   b) Entró, pero por la puerta de la tienda → NO es que le falte iniciar
   *      sesión, es que esta puerta no es la suya. Mandarlo al login sería
   *      mentirle: su sesión está perfecta. Se le explica en el lugar.
   *
   * El caso (b) pasa de verdad y seguido: la misma persona administra la
   * tienda y es clienta de su propia tienda, con el mismo correo en las dos
   * tablas y una sesión abierta de cada una. Ver AuthContext.
   */
  if (!isAuthenticated) {
    if (soloPersonal && haySesionDeCliente) {
      return <SinPermiso />;
    }
    /*
     * Al login que corresponde. Mandar al personal a la puerta de los
     * clientes lo deja probando una contraseña que ahí no sirve.
     */
    const puerta = soloPersonal ? '/admin' : '/iniciar-sesion';
    return <Navigate to={`${puerta}?volver=${encodeURIComponent(pathname + search)}`} replace />;
  }

  /*
   * 2- Con sesión de esta área, pero de quien no es. Red de seguridad: con
   *    los cajones separados no debería entrar aquí, pero si alguna vez una
   *    sesión de cliente termina en el cajón del personal, mejor explicarlo
   *    que dejarla ver el panel a medias.
   */
  if (soloPersonal && esCliente) {
    return <SinPermiso />;
  }

  /*
   * 2.5- Ruta de solo-dueño. Un empleado tiene sesión de personal perfecta —
   * pasó los dos filtros de arriba— pero esta puerta no es la suya: precios,
   * proveedores, promociones, empleados, clientes, ajustes de la tienda. No
   * es un problema de sesión (por eso no se manda al login); es un permiso.
   */
  if (soloAdmin && user?.type !== 'admin') {
    return <SinPermiso />;
  }

  // 3- Todo en orden: renderizamos la ruta hija (AdminLayout y sus páginas)
  return <Outlet />;
};

export default ProtectedRoute;
