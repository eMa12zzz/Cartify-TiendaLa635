import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Verification from './pages/Verification';
import CreatePassword from './pages/CreatePassword';
import LoginPassword from './pages/LoginPassword';
import Dashboard from './pages/Dashboard';
import Store from './pages/Store';
import AdminLayout from './components/Layout/AdminLayout';
import Inventory from './pages/Inventory';
import AdminDashboard from './pages/AdminDashboard';
import Orders from './pages/Orders';
import Modules from './pages/Modules';
import Brands from './pages/Brands';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import impresiones from './pages/impresiones';
import Impresiones from './pages/impresiones';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/create-password" element={<CreatePassword />} />
        <Route path="/login-password" element={<LoginPassword />} />
        <Route path="/tienda-dashboard" element={<Dashboard />} />
        <Route path="/store" element={<Store />} />
        <Route path="/impresiones" element={<Impresiones/>} />

        {/* Admin Layout */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/inventario" element={<Inventory />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/modulos" element={<Modules />} />
          <Route path="/marcas" element={<Brands />} />
          <Route path="/empleados" element={<Employees />} />
          <Route path="/clientes" element={<Customers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;