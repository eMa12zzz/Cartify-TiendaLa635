import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useTheme } from '../../context/ThemeContext';

const AdminLayout = () => {
  const location = useLocation();
  const { palette } = useTheme();
  const c = palette.colors;

  return (
    <>
      <style>{`
        /* ===== GLOBAL ADMIN THEME OVERRIDES ===== */

        /* Card / surface backgrounds */
        .admin-theme .bg-white { background-color: ${c.cardBg} !important; }

        /* Borders */
        .admin-theme .border-gray-100 { border-color: ${c.cardBorder} !important; }
        .admin-theme .border-gray-200 { border-color: ${c.cardBorder} !important; }
        .admin-theme .border-gray-300 { border-color: ${c.cardBorder} !important; }
        .admin-theme .border-gray-50  { border-color: ${c.cardBorder} !important; }

        /* Accent heading color */
        .admin-theme .text-\\[\\#C28C5D\\] { color: ${c.accent} !important; }

        /* Primary button bg + readable text */
        .admin-theme .bg-\\[\\#B47C4D\\],
        .admin-theme .bg-\\[\\#C28C5D\\],
        .admin-theme .bg-\\[\\#E07A2B\\] { 
          background-color: ${c.primary} !important; 
          color: ${c.buttonText} !important; 
        }
        .admin-theme .hover\\:bg-\\[\\#9C6026\\]:hover { background-color: ${c.primaryHover} !important; color: ${c.buttonText} !important; }
        .admin-theme .text-\\[\\#B47C4D\\] { color: ${c.primary} !important; }
        .admin-theme .bg-\\[\\#9C6026\\] { background-color: ${c.primaryHover} !important; color: ${c.buttonText} !important; }

        /* Text hierarchy */
        .admin-theme .text-gray-900 { color: ${c.textPrimary} !important; }
        .admin-theme .text-gray-800 { color: ${c.textPrimary} !important; }
        .admin-theme .text-gray-700 { color: ${c.textSecondary} !important; }
        .admin-theme .text-gray-600 { color: ${c.textSecondary} !important; }
        .admin-theme .text-gray-500 { color: ${c.textMuted} !important; }
        .admin-theme .text-gray-400 { color: ${c.textMuted} !important; }

        /* Hover row / subtle bg */
        .admin-theme .hover\\:bg-gray-50:hover { background-color: ${c.primaryLight} !important; }
        .admin-theme .hover\\:bg-gray-100:hover { background-color: ${c.primaryLight} !important; }
        .admin-theme .bg-gray-50 { background-color: ${c.primaryLight} !important; }
        .admin-theme .bg-gray-100 { background-color: ${c.primaryLight} !important; }

        /* Focus states */
        .admin-theme input:focus { border-color: ${c.primary} !important; }
        .admin-theme select:focus { border-color: ${c.primary} !important; }
        .admin-theme textarea:focus { border-color: ${c.primary} !important; }

        /* Search icon color */
        .admin-theme .text-\\[\\#D08B5B\\] { color: ${c.primary} !important; }

        /* Table header/body bg */
        .admin-theme th.bg-white { background-color: ${c.cardBg} !important; }
        .admin-theme thead { background-color: ${c.cardBg} !important; }
        .admin-theme tbody { background-color: ${c.cardBg} !important; }

        /* Dividers */
        .admin-theme .divide-gray-100 > * + * { border-color: ${c.cardBorder} !important; }
        .admin-theme .border-b { border-color: ${c.cardBorder} !important; }
        .admin-theme hr { border-color: ${c.cardBorder} !important; }

        /* Modal overlay */
        .admin-theme .bg-black\\/40,
        .admin-theme .bg-black\\/50 { background-color: rgba(0,0,0,0.6) !important; }

        /* ===== FORM ELEMENTS (inputs, selects, textareas) ===== */
        .admin-theme input:not([type="checkbox"]),
        .admin-theme select,
        .admin-theme textarea {
          background-color: ${c.cardBg} !important;
          color: ${c.textPrimary} !important;
          border-color: ${c.cardBorder} !important;
        }
        .admin-theme input::placeholder,
        .admin-theme textarea::placeholder {
          color: ${c.textMuted} !important;
        }
        .admin-theme option {
          background-color: ${c.cardBg} !important;
          color: ${c.textPrimary} !important;
        }
        .admin-theme label {
          color: ${c.textSecondary} !important;
        }

        /* Form modal panels — the left colored sidebar in ProductFormModal */
        .admin-theme .bg-\\[\\#9C6026\\] { background-color: ${c.primaryHover} !important; color: ${c.buttonText} !important; }
        .admin-theme .bg-\\[\\#FAF9F6\\] { background-color: ${c.cardBg} !important; }

        /* Gray button backgrounds in modals */
        .admin-theme button.bg-gray-300 { background-color: ${c.cardBorder} !important; color: ${c.textPrimary} !important; }
        .admin-theme button.hover\\:bg-gray-400:hover { background-color: ${c.textMuted} !important; }

        /* ===== PRIMARY BUTTONS — readable text ===== */
        .admin-theme button.bg-\\[\\#B47C4D\\],
        .admin-theme button[class*="bg-\\[\\#B47C4D\\]"],
        .admin-theme .bg-\\[\\#B47C4D\\] {
          background-color: ${c.primary} !important;
          color: ${c.buttonText} !important;
        }
        
        .admin-theme button.bg-\\[\\#B47C4D\\]:hover,
        .admin-theme .bg-\\[\\#B47C4D\\]:hover {
          background-color: ${c.primaryHover} !important;
          color: ${c.buttonText} !important;
        }
        
        /* Any text-white inside a primary button should respect buttonText */
        .admin-theme .bg-\\[\\#B47C4D\\] .text-white,
        .admin-theme .bg-\\[\\#9C6026\\] .text-white {
          color: ${c.buttonText} !important;
        }

        /* Keep white text on red delete buttons */
        .admin-theme .bg-red-500 { background-color: #ef4444 !important; color: #fff !important; }
        .admin-theme .bg-red-500 .text-white, .admin-theme .bg-red-500 h2 { color: #fff !important; }
        .admin-theme .hover\\:bg-red-600:hover { background-color: #dc2626 !important; }

        /* ===== PROTECT STATUS COLORS ===== */
        .admin-theme .text-green-500 { color: #22c55e !important; }
        .admin-theme .text-red-500   { color: #ef4444 !important; }
        .admin-theme .text-orange-500 { color: #f97316 !important; }
        .admin-theme .text-purple-500 { color: #a855f7 !important; }
        .admin-theme .text-blue-500   { color: #3b82f6 !important; }
        .admin-theme .text-\\[\\#0066FF\\] { color: #0066FF !important; }

        /* Protect profile avatar */
        .admin-theme .avatar-fixed { background-color: #374151 !important; }

        /* Keep text-white where explicitly used globally, BUT NOT inside primary panels */
        .admin-theme .text-white { color: ${c.buttonText} !important; }

        /* Ensure modal header text uses buttonText on colored primary bg */
        .admin-theme .bg-\\[\\#9C6026\\] h2,
        .admin-theme .bg-\\[\\#9C6026\\] label { color: ${c.buttonText} !important; opacity: 0.9; }
        
        .admin-theme .bg-\\[\\#9C6026\\] p,
        .admin-theme .bg-\\[\\#9C6026\\] div { color: ${c.buttonText} !important; }

        /* ProductCard image upload area */
        .admin-theme .border-dashed { border-color: ${c.cardBorder} !important; }

        /* Smooth transitions */
        .admin-theme * { transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease; }
      `}</style>

      <div className="admin-theme flex min-h-screen" style={{ backgroundColor: c.mainBg }}>
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col">
          <TopBar />
          <main className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;


