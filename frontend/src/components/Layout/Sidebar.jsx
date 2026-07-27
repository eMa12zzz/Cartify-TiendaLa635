import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Truck, 
  Tag, 
  Users, 
  UserSquare2, 
  Shapes,
  Blocks,
  Award,
  Megaphone,
  Printer,
  Gift,
  Settings
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = () => {
  const location = useLocation();
  const { palette } = useTheme();
  const c = palette.colors;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventario', path: '/inventario', icon: Package },
    { name: 'Pedidos', path: '/pedidos', icon: ShoppingBag },
    { name: 'Proveedores', path: '/proveedores', icon: Truck },
    { name: 'Marcas', path: '/marcas', icon: Tag },
    { name: 'Empleados', path: '/empleados', icon: Users },
    { name: 'Clientes', path: '/clientes', icon: UserSquare2 },
    { name: 'Categorías', path: '/categorias', icon: Shapes },
    { name: 'Módulos', path: '/modulos', icon: Blocks },
    { name: 'Fidelidad', path: '/fidelidad', icon: Award },
    { name: 'Promociones', path: '/promociones', icon: Megaphone },
    { name: 'Impresiones', path: '/servicios-impresion', icon: Printer },
    { name: 'Tarjetas de saldo', path: '/tarjetas', icon: Gift },
  ];

  return (
    <aside
      className="w-64 h-screen flex flex-col fixed left-0 top-0 transition-colors duration-300"
      style={{ backgroundColor: c.sidebarBg, borderRight: `1px solid ${c.sidebarBorder}` }}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold leading-none tracking-tight" style={{ color: c.textPrimary }}>
          Tienda<br />la 635
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: isActive ? c.primary : c.sidebarText,
                backgroundColor: isActive ? c.primaryLight : 'transparent',
              }}
            >
              <item.icon className="w-5 h-5" style={{ color: isActive ? c.primary : c.textMuted }} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.primary }}></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{ borderTop: `1px solid ${c.sidebarBorder}` }}>
        <Link
          to="/cuenta"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
          style={{
            color: location.pathname === '/cuenta' ? c.primary : c.sidebarText,
            backgroundColor: location.pathname === '/cuenta' ? c.primaryLight : 'transparent',
          }}
        >
          <Settings className="w-5 h-5" style={{ color: location.pathname === '/cuenta' ? c.primary : c.textMuted }} />
          Cuenta
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;

