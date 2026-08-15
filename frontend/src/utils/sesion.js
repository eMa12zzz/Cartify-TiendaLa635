/*
 * ============================================================
 * LOS DOS CAJONES DE SESIÓN — sesion.js
 * ============================================================
 * Dónde vive cada sesión y qué área manda en cada ruta.
 *
 * Vivía dentro de AuthContext, pero ahora también lo necesita el interceptor
 * de axios (api.js) para saber a QUIÉN echar cuando el servidor contesta 401.
 * Y api.js no puede importar AuthContext —AuthContext ya importa api.js y se
 * armaría un círculo—, así que lo compartido baja aquí, a un archivo sin
 * ninguna importación propia.
 *
 * Es la misma idea de siempre: dos cajones porque el dueño es administrador Y
 * cliente de su propia tienda, con las dos sesiones abiertas a la vez.
 * ============================================================
 */

export const CAJON = {
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
 *
 * OJO: toda ruta nueva del panel hay que agregarla aquí.
 */
export const RUTAS_DEL_PANEL = [
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
