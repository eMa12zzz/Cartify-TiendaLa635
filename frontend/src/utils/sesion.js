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
 * ============================================================
 * EL MODO TRABAJO
 * ============================================================
 * "Ahora mismo estoy repartiendo", dicho por quien lo hace.
 *
 * EL PROBLEMA QUE RESUELVE
 * En el área de cliente manda el cajón de cliente si existe. Eso está bien
 * casi siempre —es la tienda— pero deja fuera un caso real y diario: el
 * repartidor que ADEMÁS es cliente de la tienda donde trabaja. Con su sesión
 * de cliente abierta en su propio teléfono, /mi-cuenta/reparto le contestaba
 * "esta pantalla es para el personal" aunque su sesión de empleado estuviera
 * ahí al lado. Para poder trabajar tenía que cerrar su cuenta personal.
 *
 * Con este interruptor lo dice él: mientras está encendido manda su sesión de
 * personal y la pantalla se reduce a Reparto —que es lo único que vino a
 * hacer—; apagado, vuelve a ser un cliente más y ve su cuenta completa.
 *
 * Vive en localStorage y no en memoria porque tiene que sobrevivir a que se
 * bloquee el teléfono y a que se recargue la página, que en la calle pasa
 * todo el tiempo.
 * ============================================================
 */
export const LLAVE_MODO_TRABAJO = 'sesion:trabajando';

export const leerModoTrabajo = () => {
  try {
    return localStorage.getItem(LLAVE_MODO_TRABAJO) === '1';
  } catch {
    // Sin localStorage (modo privado), simplemente no está trabajando.
    return false;
  }
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
