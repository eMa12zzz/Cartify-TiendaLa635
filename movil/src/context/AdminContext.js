/*
 * ============================================================
 * EL ADMINISTRADOR EN EL TELÉFONO — AdminContext.js
 * ============================================================
 * Cuando el administrador entra desde la app, la app deja de ser la tienda:
 * solo queda Tiqui del panel (pages/admin/TiquiAdmin.js), para preguntarle
 * cómo va el negocio y pedirle cambios. Nada de catálogo, carrito ni pedidos
 * de cliente. Por eso App.js elige entre dos árboles según haya o no sesión de
 * administrador, y no es una pestaña más de la tienda.
 *
 * La sesión va aparte de la del cliente, en su propia llave del almacén
 * seguro, y nunca se instala como el token de la tienda (ver tiquiAdminApi).
 * ============================================================
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { borrar, guardar, leer, llave } from '../utils/almacen';
import { tiquiAdminApi } from '../api/tiquiAdminApi';

const AdminContext = createContext(null);
const LLAVE_SESION_ADMIN = llave('cartify', 'sesion-admin');

export const AdminProvider = ({ children }) => {
  const [sesion, setSesion] = useState(null); // { token, nombre, email }
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    leer(LLAVE_SESION_ADMIN).then((crudo) => {
      if (!vivo) return;
      try {
        const datos = JSON.parse(crudo || 'null');
        if (datos?.token) setSesion(datos);
      } catch {
        // Ilegible: como si no hubiera sesión.
      }
      setCargando(false);
    });
    return () => { vivo = false; };
  }, []);

  const iniciar = useCallback((datos) => {
    setSesion(datos);
    guardar(LLAVE_SESION_ADMIN, JSON.stringify(datos));
  }, []);

  const salir = useCallback(() => {
    setSesion(null);
    borrar(LLAVE_SESION_ADMIN);
    tiquiAdminApi.salir();
  }, []);

  const valor = useMemo(() => ({ sesion, cargando, iniciar, salir }), [sesion, cargando, iniciar, salir]);
  return <AdminContext.Provider value={valor}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin debe usarse dentro de <AdminProvider>');
  return ctx;
};
