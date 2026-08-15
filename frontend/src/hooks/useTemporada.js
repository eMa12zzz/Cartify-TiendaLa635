import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAjustesCtx } from '../context/AjustesContext';
import { temaActivo, aplicarTema } from '../utils/temporadas';
import { derivarMarca } from '../utils/colorMarca';

/*
 * ============================================================
 * TEMPORADA — useTemporada.js
 * ============================================================
 * Pinta la tienda del color de la fecha. Toda la lógica de QUÉ tema toca vive
 * en utils/temporadas.js; este hook se encarga de CUÁNDO y DÓNDE aplicarlo.
 *
 * SOLO EN EL ÁREA DEL CLIENTE, y esto no es un detalle. El panel tiene sus
 * cinco paletas de accesibilidad —alto contraste, deuteranopía, modo oscuro—
 * que alguien eligió porque las necesita para trabajar. Repintarle el panel de
 * rojo y verde en diciembre le arruinaría eso justo a quien menos se lo puede
 * permitir. La temporada es decoración de cara al cliente; el panel es una
 * herramienta de trabajo.
 *
 * Se recalcula al cambiar de ruta —no solo al montar— porque la app no se
 * recarga al navegar: sin eso, entrar al panel desde la tienda dejaría los
 * colores de Navidad puestos encima de la paleta del administrador.
 * ============================================================
 */

// Las rutas del panel, que NO se repintan. Es la misma frontera que separa los
// dos cajones de sesión; ver areaDeRuta en AuthContext.
const esPanel = (pathname = '') =>
  /^\/(admin|dashboard|inventario|pedidos|modulos|marcas|empleados|clientes|proveedores|categorias|fidelidad|promociones|servicios-impresion|tarjetas|personalizacion|cuenta)(\/|$)/.test(pathname);

export const useTemporada = () => {
  const { ajustes } = useAjustesCtx();
  const { pathname } = useLocation();

  /*
   * La fecha se toma UNA vez por render del cálculo, no en cada comparación.
   * A nadie le cambia la temporada mientras mira la pantalla; si alguien deja
   * la tienda abierta del 30 de noviembre al 1 de diciembre, se pinta de
   * Navidad en la siguiente navegación y con eso basta.
   */
  const tema = useMemo(
    () => temaActivo(ajustes.temporada),
    [ajustes.temporada]
  );

  /*
   * El color base de la marca que eligió el dueño. Es el tema de todos los días:
   * se aplica siempre en la tienda, y una temporada activa lo pisa mientras dura.
   * Sin color elegido, queda null y manda el café que declara index.css.
   */
  const temaBase = useMemo(() => {
    const colores = derivarMarca(ajustes.colorMarca);
    return colores ? { clave: 'personalizado', colores } : null;
  }, [ajustes.colorMarca]);

  const enPanel = esPanel(pathname);

  useEffect(() => {
    // Prioridad: temporada (temporal) > color base del dueño > café de fábrica.
    aplicarTema(enPanel ? null : (tema || temaBase));
    // Al desmontar se despinta: si no, el tema quedaría puesto sobre cualquier
    // pantalla que se monte después sin pasar por aquí.
    return () => aplicarTema(null);
  }, [tema, temaBase, enPanel]);

  /*
   * La decoración (la cinta y las figuras cayendo) se puede apagar dejando
   * solo los colores. Va encendida por defecto: quien elige poner Navidad
   * espera que se note, no tener que ir a buscar un segundo interruptor.
   */
  const conDecoracion = ajustes.temporada?.decoracion !== false;

  return {
    tema,
    activo: !enPanel && !!tema,
    conDecoracion,
  };
};
