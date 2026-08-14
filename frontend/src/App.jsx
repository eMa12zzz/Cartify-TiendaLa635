import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { EdadProvider } from './context/EdadContext';
import { FavoritosProvider } from './context/FavoritosContext';
import { DireccionProvider } from './context/DireccionContext';
import { AjustesProvider } from './context/AjustesContext';
import { useTemporada } from './hooks/useTemporada';
import DecoracionTemporada from './components/Store/DecoracionTemporada';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import LimiteDeError from './components/UI/LimiteDeError';
import BotonWhatsApp from './components/Store/BotonWhatsApp';
import BurbujaPedido from './components/Store/BurbujaPedido';
import VincularKiosco from './pages/VincularKiosco';

/*
 * ============================================================
 * IMPORTACIÓN DE PÁGINAS — App.jsx
 * ============================================================
 * Aquí se importan todos los componentes de página que el
 * enrutador (React Router) necesita para renderizar.
 * ============================================================
 */

// --- Autenticación ---
import LoginClient from './pages/LoginClient';    // Login de clientes ("/")
import LoginAdmin from './pages/LoginAdmin';      // Login de administradores ("/admin")
import Register from './pages/Register';          // Registro de nuevos clientes
import Verification from './pages/Verification'; // Verificación de código (registro, 2FA, recuperación)
import CreatePassword from './pages/CreatePassword'; // Paso final de recuperación de contraseña
import LoginPassword from './pages/LoginPassword';
import ForgotPassword from './pages/ForgotPassword'; // Solicitar recuperación de contraseña

// --- Tienda pública ---
import Dashboard from './pages/Dashboard';        // Panel de la tienda para clientes
import Store from './pages/Store';
import Seccion from './pages/Seccion';       // Una sección de la portada, completa
import NoEncontrado from './pages/NoEncontrado'; // 404: cualquier dirección que no exista
import Impresiones from './pages/impresiones';
import Terminos from './pages/Terminos';         // Términos de uso y aviso de privacidad

// --- Panel Administrativo ---
import AdminLayout from './components/Layout/AdminLayout'; // Layout compartido del admin (sidebar + topbar)
import Inventory from './pages/Inventory';
import AdminDashboard from './pages/AdminDashboard';
import Orders from './pages/Orders';
import Modules from './pages/Modules';
import Brands from './pages/Brands';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Categories from './pages/Categories';
import Fidelidad from './pages/Fidelidad';
import Promociones from './pages/Promociones';
import GiftCards from './pages/GiftCards';
import ServiciosImpresion from './pages/ServiciosImpresion';
import Personalizacion from './pages/Personalizacion';
import AccountSettings from './pages/AccountSettings';

// --- Área "Mi Cuenta" del cliente ---
import ClienteLayout from './components/Layout/ClienteLayout';
import PuntosFidelidad from './pages/cliente/PuntosFidelidad';
import MisPedidos from './pages/cliente/MisPedidos';
import EstadoPedido from './pages/cliente/EstadoPedido';
import Favoritos from './pages/cliente/Favoritos';
import Bienvenida from './pages/Bienvenida';
import Reparto from './pages/cliente/Reparto';
import Recibidos from './pages/cliente/Recibidos';
import DetallesCuenta from './pages/cliente/DetallesCuenta';
import Direcciones from './pages/cliente/Direcciones';
import MetodoPago from './pages/cliente/MetodoPago';
import Notificaciones from './pages/cliente/Notificaciones';
import CentroAyuda from './pages/cliente/CentroAyuda';


/*
 * Pinta la tienda del color de la temporada (Navidad, Halloween...). No dibuja
 * nada: solo repinta las variables de marca sobre el documento. Vive como
 * componente y no como una llamada suelta porque necesita estar DENTRO de los
 * proveedores —lee los ajustes— y dentro del router —mira la ruta para no
 * tocar el panel—. Ver useTemporada.
 */
const PinturaDeTemporada = () => {
  const { tema, activo, conDecoracion } = useTemporada();
  // Las figuras cayendo van aquí arriba y no dentro de cada pantalla: es una
  // capa fija sobre toda la ventana, así que montarla una vez basta.
  return activo && conDecoracion ? <DecoracionTemporada tema={tema} /> : null;
};

/*
 * El router va POR FUERA de la sesión, al revés que antes.
 * AuthProvider ahora necesita saber en qué área está parada la persona —el
 * panel o la tienda— para decidir cuál de los dos cajones de sesión manda, y
 * eso solo lo sabe estando dentro del router. Ver AuthContext.
 */
/*
 * El clientId de Google sale de la variable de entorno del frontend
 * (VITE_GOOGLE_CLIENT_ID). Es el mismo id que el backend usa para verificar el
 * token. Si falta, el botón de Google simplemente no funciona, pero el resto de
 * la app sigue igual.
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <AuthProvider>
        {/*
          Cómo se ve la tienda —nombre, logo, orden de la portada, temporada—
          se pide una sola vez y lo lee quien lo necesite. Va bien arriba
          porque lo usan el encabezado, el pie y la portada por igual.
          Ver AjustesContext.
        */}
        <AjustesProvider>
        <PinturaDeTemporada />
        {/*
          El candado de los productos +18: vive alto para que la tarjeta, el
          detalle y el carrito compartan una sola confirmación de edad, y el
          modal se pinte sobre cualquier pantalla. Ver EdadContext.
        */}
        <EdadProvider>
        {/*
          Los favoritos se cargan una sola vez para toda la app: los mismos
          corazones aparecen en la tienda y en Mi Cuenta, que son ramas
          distintas del árbol de rutas. Va dentro del router porque el hook
          navega al login cuando alguien sin sesión toca un corazón.
        */}
        <FavoritosProvider>
        {/*
          La dirección de entrega también se comparte: el encabezado la
          muestra y el carrito la cobra. Ver DireccionContext.
        */}
        <DireccionProvider>
        {/*
          Los avisos van ABAJO a la derecha: arriba tapaban el carrito y "Mi
          Cuenta" justo cuando la persona acababa de tocarlos, que es el peor
          momento posible para taparle el botón.

          Y sin emojis: un 🛒 gigante junto al texto no dice nada que el texto
          no diga ya, y hace que la tienda parezca un chat. Se quedan los
          iconos de la librería, que son marcas discretas de éxito o error.
        */}
        <Toaster
          position="bottom-right"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#fff',
              color: '#2A1A0E',
              border: '1px solid #EDE7E0',
              borderRadius: 14,
              boxShadow: '0 10px 30px rgba(0,0,0,0.10)',
              fontSize: 14,
              fontWeight: 500,
              padding: '12px 16px',
              maxWidth: 420,
            },
            success: { iconTheme: { primary: '#B46C30', secondary: '#fff' } },
            error: { duration: 5000, iconTheme: { primary: '#D8542C', secondary: '#fff' } },
          }}
        />
        {/* Flotante de WhatsApp: se pinta solo en las pantallas del cliente. */}
        <BotonWhatsApp />
        {/* Seguimiento del pedido en curso; va a la izquierda para no chocar
            con el de WhatsApp, que ocupa la esquina derecha. */}
        <BurbujaPedido />
        {/*
          La red debajo de TODAS las pantallas.

          Si algo revienta mientras se dibuja una página, React desmonta el
          árbol entero y queda una pantalla blanca absoluta, sin ninguna
          salida. Envolviendo aquí, un error en una pantalla se queda en esa
          pantalla: se explica y se ofrece cómo volver. Ver LimiteDeError.
        */}
        <LimiteDeError>
        <Routes>

          {/* ── Rutas Públicas (sin autenticación) ─────────────────── */}
          {/*
           * La puerta de la tienda es la TIENDA, no el login.
           *
           * Antes lo primero que veía cualquiera era un formulario de inicio
           * de sesión, y eso es pedirle matrimonio a alguien que solo venía a
           * ver los precios. Ahora se entra, se mira y se llena el carrito
           * sin cuenta; la sesión se pide cuando de verdad hace falta (al
           * pagar, en Mi Cuenta, para guardar favoritos).
           */}
          <Route path="/"                element={<Store />} />
          <Route path="/iniciar-sesion"  element={<LoginClient />} />      {/* Login de clientes */}
          {/* Lo que abre el teléfono al escanear el QR del kiosco */}
          <Route path="/vincular/:codigo" element={<VincularKiosco />} />
          <Route path="/admin"           element={<LoginAdmin />} />       {/* Login de administradores */}
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verification"    element={<Verification />} />     {/* Código de verificación */}
          <Route path="/create-password" element={<CreatePassword />} />
          <Route path="/login-password"  element={<LoginPassword />} />
          {/* Primera pantalla tras entrar: el saludo con el mapa */}
          <Route path="/bienvenida"      element={<Bienvenida />} />
          <Route path="/tienda-dashboard" element={<Dashboard />} />
          <Route path="/store"           element={<Store />} />
          {/* "Ver todos" de una fila de la portada: /seccion/familia-quesos */}
          <Route path="/seccion/:clave"  element={<Seccion />} />
          <Route path="/impresiones"     element={<Impresiones />} />
          {/*
           * Términos y privacidad. Es PÚBLICA a propósito: hay que poder leerla
           * ANTES de registrarse —que es justo cuando se decide si uno entrega
           * sus datos— y desde el enlace del pie sin tener cuenta.
           */}
          <Route path="/terminos"        element={<Terminos />} />

          {/*
           * ── Rutas Protegidas (requieren autenticación) ──────────────
           * <ProtectedRoute> verifica si hay sesión. Si no hay, redirige a "/".
           * <AdminLayout> envuelve las páginas del panel con el sidebar y el topbar.
           */}
          {/* soloPersonal: una sesión de cliente aquí ve la explicación, no el
              panel. Ver ProtectedRoute. */}
          <Route element={<ProtectedRoute soloPersonal />}>
            <Route element={<AdminLayout />}>
              {/* Lo que ve TODO el personal, admin o empleado */}
              <Route path="/dashboard"   element={<AdminDashboard />} />
              <Route path="/pedidos"     element={<Orders />} />
              <Route path="/cuenta"      element={<AccountSettings />} />

              {/*
                soloAdmin: un empleado con sesión de personal válida no pasa de
                aquí — precios, proveedores, promociones, empleados, clientes y
                ajustes de la tienda son cosa del dueño. Ver ProtectedRoute.
              */}
              <Route element={<ProtectedRoute soloAdmin />}>
                <Route path="/inventario"  element={<Inventory />} />
                <Route path="/modulos"     element={<Modules />} />
                <Route path="/marcas"      element={<Brands />} />
                <Route path="/empleados"   element={<Employees />} />
                <Route path="/clientes"    element={<Customers />} />
                <Route path="/proveedores" element={<Suppliers />} />
                <Route path="/categorias"  element={<Categories />} />
                <Route path="/fidelidad"   element={<Fidelidad />} />
                <Route path="/promociones" element={<Promociones />} />
                <Route path="/servicios-impresion" element={<ServiciosImpresion />} />
                <Route path="/tarjetas"    element={<GiftCards />} />
                {/* Nombre, logo y orden de la portada de la tienda */}
                <Route path="/personalizacion" element={<Personalizacion />} />
              </Route>
            </Route>
          </Route>

          {/*
           * ── Área "Mi Cuenta" del cliente (protegida) ──────────────
           * Mismo guard de sesión, pero con su propio layout (ClienteLayout).
           * Se van agregando rutas aquí conforme se cablea cada página.
           */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ClienteLayout />}>
              <Route path="/mi-cuenta"           element={<DetallesCuenta />} />
              <Route path="/mi-cuenta/pedidos"   element={<MisPedidos />} />
              {/* Estado de UN pedido: línea de tiempo, envío y mapa en vivo */}
              <Route path="/mi-cuenta/pedido/:id" element={<EstadoPedido />} />
              <Route path="/mi-cuenta/favoritos" element={<Favoritos />} />
              {/* Reparto: la usa el personal desde el teléfono, en la calle */}
              <Route path="/mi-cuenta/reparto"   element={<Reparto />} />

              <Route path="/mi-cuenta/recibidos"   element={<Recibidos />} />
              <Route path="/mi-cuenta/direcciones"    element={<Direcciones />} />
              <Route path="/mi-cuenta/pagos"          element={<MetodoPago />} />
              <Route path="/mi-cuenta/notificaciones" element={<Notificaciones />} />
              <Route path="/mi-cuenta/puntos"         element={<PuntosFidelidad />} />
              <Route path="/mi-cuenta/ayuda"       element={<CentroAyuda />} />
            </Route>
          </Route>

          {/*
           * ── Cualquier otra cosa ────────────────────────────────────
           * Va de ÚLTIMA y a propósito: React Router elige la ruta más
           * específica, así que este comodín solo entra cuando ninguna de
           * arriba coincidió.
           *
           * Sin esta línea, una dirección mal escrita —o un enlace viejo que
           * alguien compartió por WhatsApp— renderizaba una pantalla en blanco
           * absoluto: ni encabezado, ni aviso, ni salida.
           */}
          <Route path="*" element={<NoEncontrado />} />

        </Routes>
        </LimiteDeError>
        </DireccionProvider>
        </FavoritosProvider>
        </EdadProvider>
        </AjustesProvider>
      </AuthProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;