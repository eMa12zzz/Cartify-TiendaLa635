import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useTheme } from '../../context/ThemeContext';

const AdminLayout = () => {
  const { palette } = useTheme();
  const c = palette.colors;

  return (
    <div className={`admin-theme flex min-h-screen`} style={{ backgroundColor: 'var(--theme-main-bg)' }}>

      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <TopBar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;


