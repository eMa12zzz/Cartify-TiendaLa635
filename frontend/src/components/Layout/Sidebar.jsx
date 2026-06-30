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
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

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
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold leading-none tracking-tight">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'text-[#B47C4D] bg-orange-50/50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-[#B47C4D]' : 'text-gray-500'}`} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B47C4D]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          to="/cuenta"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <Settings className="w-5 h-5 text-gray-500" />
          Cuenta
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
