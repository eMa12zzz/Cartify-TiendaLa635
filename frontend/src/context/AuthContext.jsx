import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';

/*
 * ============================================================
 * CONTEXTO DE AUTENTICACIÓN — AuthContext.jsx
 * ============================================================
 * DOS CAJONES DE SESIÓN, UNO POR ÁREA.
 *
 * El problema que resuelve: antes las dos áreas —el panel y la tienda—
 * guardaban su sesión en las MISMAS tres llaves de localStorage ('token',
 * 'userType', 'userData'). Entrar como cliente pisaba la sesión de
 * administrador y al volver al panel la cuenta salía como cliente; entrar
 * como administrador borraba la del cliente. Con el mismo correo en las dos
 * tablas —el caso normal aquí, el dueño es cliente de su propia tienda— eso
 * se veía como si las cuentas "se fusionaran".
 *
 * Ahora hay un cajón para cada una y no se tocan:
 *
 *   sesion:personal → administradores y empleados (el panel)
 *   sesion:cliente  → clientes (la tienda y Mi Cuenta)
 *
 * En qué cajón se GUARDA lo decide el tipo de cuenta que devolvió el backend.
 * Cuál se USA lo decide dónde está parada la persona: en el panel manda el
 * cajón del personal, y en la tienda el del cliente. Así se puede estar
 * conectado como las dos cosas a la vez en el mismo navegador, que es
 * justamente lo que hace el dueño todos los días.
 *
 * Expone lo mismo de siempre (`user`, `token`, `login`, `logout`,
 * `isAuthenticated`) para que ningún componente tenga que enterarse de esto,
 * más dos banderas que solo necesita el guardia de rutas.
 * ============================================================
 */
export const AuthContext = createContext();

/* Dónde vive cada cajón. */
const CAJON = {
  personal: 'sesion:personal',
  cliente: 'sesion:cliente',
};

/*
 * Las rutas del panel. Todo lo demás —la tienda, Mi Cuenta, los logins de
 * cliente— es área de cliente.
 *
 * '/admin' entra en la lista aunque sea la pantalla de entrada: es la puerta
 * del personal, así que lo que se haga ahí (entrar, salir) tiene que caer en
 * el cajón del personal y no rozar la sesión de la tienda.
 */
const RUTAS_DEL_PANEL = [
  '/admin',
  '/dashboard',
  '/inventario',
  '/pedidos',
  '/modulos',
  '/marcas',
  '/empleados',
  '/clientes',
  '/proveedores',
  '/categorias',
  '/fidelidad',
  '/promociones',
  '/servicios-impresion',
  '/tarjetas',
  '/personalizacion',
  '/cuenta',
];

export const areaDeRuta = (pathname = '') =>
  RUTAS_DEL_PANEL.some((r) => pathname === r || pathname.startsWith(`${r}/`))
    ? 'personal'
    : 'cliente';

/*
 * En qué cajón va una sesión según a quién pertenece. El backend responde
 * 'client', 'admin' o 'employee'; solo el primero es del área de cliente.
 */
const cajonDeTipo = (tipo) => (tipo === 'client' ? 'cliente' : 'personal');

const leerCajon = (area) => {
  try {
    const crudo = localStorage.getItem(CAJON[area]);
    const sesion = crudo ? JSON.parse(crudo) : null;
    // Un cajón sin token es un cajón vacío, aunque tenga datos sueltos.
    return sesion?.token ? sesion : null;
  } catch {
    // JSON corrupto: se trata como si no hubiera sesión en vez de reventar
    // la app entera antes de pintar la primera pantalla.
    return null;
  }
};

/*
 * Mudanza de las llaves viejas.
 *
 * Sin esto, la primera vez que alguien abre la app después de este cambio se
 * encuentra la sesión cerrada sin haber tocado nada. Se lee lo que había,
 * se acomoda en el cajón que le toca por su tipo y se borran las llaves
 * viejas para que la mudanza pase una sola vez.
 */
const mudarSesionVieja = () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  /*
   * Sin tipo declarado se asume CLIENTE, no personal.
   *
   * Una sesión vieja de la que no sabemos nada no puede heredar los permisos
   * del panel por descuido: si acierta, no se gana nada; si se equivoca, se
   * regala una sesión de personal. Ante la duda, la de menos alcance.
   */
  const tipo = localStorage.getItem('userType') || 'client';
  let datos = {};
  try {
    datos = JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    datos = {};
  }

  const area = cajonDeTipo(tipo);
  // Si ya hay algo en ese cajón, lo nuevo manda: es lo que el usuario abrió
  // por última vez con el sistema anterior.
  localStorage.setItem(CAJON[area], JSON.stringify({ token, type: tipo, ...datos }));

  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('userData');
};

export const AuthProvider = ({ children }) => {
  const { pathname } = useLocation();

  const [sesiones, setSesiones] = useState({ personal: null, cliente: null });
  const [loading, setLoading] = useState(true);

  // 1- Al abrir la app se levantan los dos cajones de una vez, después de
  //    mudar lo que hubiera guardado el sistema anterior.
  useEffect(() => {
    mudarSesionVieja();
    setSesiones({ personal: leerCajon('personal'), cliente: leerCajon('cliente') });
    setLoading(false);
  }, []);

  /*
   * 2- La sesión que manda AQUÍ, en la pantalla donde está parada la persona.
   *
   * En el panel es la del personal y nada más: si ahí valiera la del cliente,
   * una pantalla de administración terminaría pidiendo datos con el id
   * equivocado. En la tienda manda la del cliente, pero si no hay se usa la
   * del personal — el dueño mirando su propia tienda está conectado, y el
   * repartidor entra a /mi-cuenta/reparto con su cuenta de empleado.
   */
  const area = areaDeRuta(pathname);
  const activa = area === 'personal' ? sesiones.personal : sesiones.cliente || sesiones.personal;

  /*
   * El área, también en una referencia.
   *
   * `logout` la necesita para saber qué cajón cerrar, pero NO puede depender
   * de `pathname`: si cambiara de identidad en cada navegación, un efecto tan
   * inocente como el `useEffect(() => logout(), [logout])` de LoginAdmin
   * dejaría de significar "al entrar a esta pantalla" y pasaría a significar
   * "cada vez que cambie la ruta" — que fue exactamente lo que pasó: entrar
   * como administrador guardaba la sesión y el salto a /dashboard la borraba
   * de vuelta, así que el panel nunca llegaba a abrirse.
   */
  const areaRef = useRef(area);
  useEffect(() => { areaRef.current = area; }, [area]);

  /*
   * Las otras pestañas también cuentan.
   *
   * Los cajones se leían una sola vez al montar, así que cerrar sesión en una
   * pestaña dejaba a las demás creyendo que seguía abierta —mostrando el
   * nombre, el carrito y el panel— hasta que alguien recargara. En un mostrador
   * donde se dejan tres pestañas abiertas, eso es una sesión que se cerró solo
   * de mentira.
   *
   * `storage` solo lo oyen las OTRAS pestañas, nunca la que escribió: por eso
   * no hace falta protegerse de un bucle. Mismo patrón que useStore y
   * useDireccionActiva, que ya sincronizan el carrito y la dirección.
   */
  useEffect(() => {
    const alCambiarOtraPestana = (e) => {
      // e.key es null cuando alguien hizo localStorage.clear().
      if (e.key !== null && e.key !== CAJON.personal && e.key !== CAJON.cliente) return;
      setSesiones({ personal: leerCajon('personal'), cliente: leerCajon('cliente') });
    };
    window.addEventListener('storage', alCambiarOtraPestana);
    return () => window.removeEventListener('storage', alCambiarOtraPestana);
  }, []);

  // 3- Guardar una sesión. El cajón lo elige el tipo de cuenta, no la pantalla:
  //    el personal también entra por la puerta de la tienda (desde el teléfono)
  //    y su sesión tiene que caer igual en el cajón del personal.
  const login = useCallback((nuevoToken, tipoUsuario = 'employee', datosUsuario = null) => {
    const sesion = { token: nuevoToken, type: tipoUsuario, ...(datosUsuario || {}) };
    const cajon = cajonDeTipo(tipoUsuario);

    localStorage.setItem(CAJON[cajon], JSON.stringify(sesion));
    setSesiones((previas) => ({ ...previas, [cajon]: sesion }));
  }, []);

  /*
   * 4- Cerrar sesión cierra la de ESTA área, no las dos.
   *
   * Salir del panel no tiene por qué sacar a la persona de la tienda: son dos
   * cuentas distintas aunque compartan el correo, y cerrar una no dice nada
   * sobre la otra.
   */
  const logout = useCallback((areaAcerrar) => {
    const cajon = areaAcerrar || areaRef.current;

    /*
     * Avisarle al servidor para que borre SU cookie.
     *
     * El logout solo limpiaba el navegador, así que la cookie httpOnly seguía
     * puesta 30 días: cerrar sesión dejaba media sesión abierta. Va sin await
     * y tragándose el error a propósito — si el servidor no contesta, la
     * sesión se cierra igual de este lado; lo que no puede pasar es que
     * alguien se quede dentro porque falló una petición de limpieza.
     */
    api.post(cajon === 'personal' ? '/logoutAdmin' : '/logoutClient').catch(() => {});

    localStorage.removeItem(CAJON[cajon]);
    setSesiones((previas) => ({ ...previas, [cajon]: null }));
  }, []);

  const valor = useMemo(
    () => ({
      user: activa ? { type: activa.type, ...activa } : null,
      token: activa?.token || null,
      login,
      logout,
      loading,
      isAuthenticated: !!activa?.token,
      /*
       * Para el guardia de rutas: le deja distinguir "no ha entrado" de
       * "entró, pero por la otra puerta", que son dos situaciones que se
       * resuelven de forma muy distinta. Ver ProtectedRoute.
       */
      haySesionDePersonal: !!sesiones.personal,
      haySesionDeCliente: !!sesiones.cliente,
    }),
    [activa, login, logout, loading, sesiones.personal, sesiones.cliente]
  );

  // 5- No se pintan los hijos hasta saber si hay sesión, para evitar el
  //    parpadeo de "no ha entrado" seguido de la pantalla real.
  return (
    <AuthContext.Provider value={valor}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
