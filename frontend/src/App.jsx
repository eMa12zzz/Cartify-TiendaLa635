import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';

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
import Impresiones from './pages/impresiones';

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
import AccountSettings from './pages/AccountSettings';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>

          {/* ── Rutas Públicas (sin autenticación) ─────────────────── */}
          <Route path="/"                element={<LoginClient />} />      {/* Login de clientes */}
          <Route path="/admin"           element={<LoginAdmin />} />       {/* Login de administradores */}
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verification"    element={<Verification />} />     {/* Código de verificación */}
          <Route path="/create-password" element={<CreatePassword />} />
          <Route path="/login-password"  element={<LoginPassword />} />
          <Route path="/tienda-dashboard" element={<Dashboard />} />
          <Route path="/store"           element={<Store />} />
          <Route path="/impresiones"     element={<Impresiones />} />

          {/*
           * ── Rutas Protegidas (requieren autenticación) ──────────────
           * <ProtectedRoute> verifica si hay sesión. Si no hay, redirige a "/".
           * <AdminLayout> envuelve las páginas del panel con el sidebar y el topbar.
           */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard"   element={<AdminDashboard />} />
              <Route path="/inventario"  element={<Inventory />} />
              <Route path="/pedidos"     element={<Orders />} />
              <Route path="/modulos"     element={<Modules />} />
              <Route path="/marcas"      element={<Brands />} />
              <Route path="/empleados"   element={<Employees />} />
              <Route path="/clientes"    element={<Customers />} />
              <Route path="/proveedores" element={<Suppliers />} />
              <Route path="/categorias"  element={<Categories />} />
              <Route path="/cuenta"      element={<AccountSettings />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;