/*
 * ============================================================
 * TEMA — el color con el que se pinta la tienda hoy
 * ============================================================
 * Lo que en la web hace `useTemporada` + `aplicarTema`: decidir qué temporada
 * rige y repartir sus colores.
 *
 * ── Por qué hace falta un contexto y allá bastaba una línea ──
 *
 * En la web los colores son variables CSS. Escribirlas en el <html> repinta la
 * tienda entera de una vez, porque todo el CSS ya las está leyendo. Aquí los
 * estilos son objetos y `StyleSheet.create` se evalúa al importar el módulo:
 * un color escrito ahí queda congelado. Así que la paleta viaja por contexto y
 * cada pantalla la aplica encima de sus estilos estáticos.
 *
 * De ahí la regla que siguen las pantallas de tienda: la ESTRUCTURA (medidas,
 * bordes, tipografías) se queda en StyleSheet, y solo el color de marca se
 * pone en línea. Meter todo el estilo en línea funcionaría, pero rehace cada
 * objeto en cada render y tira a la basura la única optimización que
 * StyleSheet ofrece.
 *
 * ── También la sesión ──
 *
 * Las pantallas de entrar, registrarse y verificar TAMBIÉN siguen la temporada
 * (el botón, los enlaces y el borde de foco), para que la app se vea de una
 * sola pieza: quien abre en diciembre y encuentra la tienda de verde no espera
 * que el login siga café. Consumen la paleta con `useTema()` igual que la
 * tienda. Lo único que se queda con el café de la marca es el panel de
 * administración —que no existe en móvil—, porque ahí el color es accesibilidad
 * y no decoración.
 * ============================================================
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAjustes } from '../api/ajustesApi';
import { COLORES } from '../theme/colores';
import { temaActivo } from '../utils/temporadas';

const TemaContext = createContext(null);

/*
 * Los colores de siempre. Salen de la paleta de la app y de los tokens de la
 * web (`--marca-400` y `--acento`, que en móvil no existían porque hasta ahora
 * no había nada que los usara).
 */
export const PALETA_BASE = {
  marcaOscuro: COLORES.marcaOscuro,
  marca: COLORES.marca,
  marcaClaro: '#D8A860',
  marcaSuave: COLORES.marcaSuave,
  marcaTenue: '#FBF6F0',
  acento: '#F08400',
};

export const TemaProvider = ({ children }) => {
  const [temporada, setTemporada] = useState(null);
  const [decoracionEncendida, setDecoracionEncendida] = useState(true);

  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        const ajustes = await getAjustes();
        if (!vivo) return;
        setTemporada(ajustes?.temporada || null);
        /*
         * La decoración se puede apagar dejando solo los colores. Va encendida
         * por defecto: quien elige poner Navidad espera que se note, no tener
         * que ir a buscar un segundo interruptor.
         */
        setDecoracionEncendida(ajustes?.temporada?.decoracion !== false);
      } catch {
        /*
         * Sin ajustes la tienda se ve con los colores de siempre, que es
         * exactamente lo correcto. Que la portada no cargue porque falló el
         * documento de configuración sería cambiar la tienda por un adorno.
         */
      }
    })();

    return () => {
      vivo = false;
    };
  }, []);

  /*
   * La fecha se toma UNA vez por cálculo. A nadie le cambia la temporada
   * mientras mira la pantalla; si alguien deja la app abierta del 30 de
   * noviembre al 1 de diciembre, se pinta de Navidad la próxima vez que abra.
   */
  const tema = useMemo(() => temaActivo(temporada), [temporada]);

  const valor = useMemo(
    () => ({
      // El tema crudo, para quien necesite su clave o su saludo.
      tema,
      activo: !!tema,
      // La paleta ya resuelta: siempre completa, haya temporada o no.
      colores: tema ? { ...PALETA_BASE, ...tema.colores } : PALETA_BASE,
      decoracion: tema && decoracionEncendida ? tema.decoracion : null,
    }),
    [tema, decoracionEncendida]
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
};

/*
 * El atajo de las pantallas de tienda. Devuelve la paleta y no el tema pelado
 * porque lo que casi siempre se quiere es un color: `const { colores } =
 * useTema()` y después `colores.marca`.
 */
export const useTema = () => {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema debe usarse dentro de <TemaProvider>');
  return ctx;
};
