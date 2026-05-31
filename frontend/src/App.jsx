import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Verification from './pages/Verification';
import CreatePassword from './pages/CreatePassword';
import LoginPassword from './pages/LoginPassword';
import Dashboard from './pages/Dashboard';
import Store from './pages/Store'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/create-password" element={<CreatePassword />} />
        <Route path="/login-password" element={<LoginPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/store" element={<Store />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;