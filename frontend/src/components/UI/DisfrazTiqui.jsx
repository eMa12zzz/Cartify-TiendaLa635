/*
 * ============================================================
 * DISFRAZ DE TIQUI — DisfrazTiqui.jsx
 * ============================================================
 * Lo que Tiqui lleva puesto según la temporada: gorros, sombreros, corbatín,
 * moño o bufanda. Qué disfraz toca lo decide utils/disfracesTiqui.js; aquí
 * solo se dibuja.
 *
 * Va DENTRO del grupo que mueve a la etiqueta, en las mismas coordenadas que
 * mascotaFormas.js (lienzo de 400 × 470), así que se mece, salta y cae con
 * ella sin tener que animarlo aparte. Lo dibujan los tres Tiquis —Mascota,
 * MascotaAsistente y MascotaColgada— y se ve igual en los tres.
 *
 * EL CONTORNO. Cada pieza lleva un borde del color de los rasgos (blanco
 * sobre la etiqueta navy, navy sobre la blanca del modo oscuro). Sin él, un
 * corbatín azul sobre un cuerpo navy o el ala blanca del gorro sobre la
 * etiqueta blanca se perdían: el borde las despega del cuerpo en los dos
 * modos, como una calcomanía.
 *
 * Los sombreros cubren la cabeza ENTERA, de hombro a hombro: uno parado en
 * la punta de la etiqueta deja los hombros asomando y se ve puesto encima,
 * no puesto. Tapan el agujero a propósito y el cordón sale por el costado
 * derecho, como una antena. El ala queda por arriba de las cejas, que suben
 * unos píxeles cuando Tiqui escucha.
 * ============================================================
 */

const ROJO_RUBOR = '#F0707F';
const BLANCO = '#FFFFFF';

// La estrella del gorro de las temporadas con estrellas, centrada en (170, 46):
// la punta del gorro.
const ESTRELLA =
  'M170,29 L174.1,40.3 L186.2,40.8 L176.7,48.2 L180,59.8 L170,53 L160,59.8 L163.3,48.2 L153.8,40.8 L165.9,40.3 Z';

const PIEZAS = {
  /*
   * Gorro de Santa con la punta caída por el costado: el pompón queda a medias
   * sobre el cuerpo para verse también sobre el fondo blanco.
   *
   * El gorro y la punta son UNA sola forma, sin muesca. Eran dos piezas
   * encimadas y el borde de la punta quedaba como una raya cruzando el gorro;
   * después, con una muesca, se veía el fondo por el doblez como una cuña. El
   * doblez ahora es solo una línea de rojo más oscuro.
   */
  'gorro-navidad': ({ principal }) => (
    <>
      <path d="M132,188 C134,146 162,110 206,98 C242,88 280,102 294,138 C300,158 300,194 296,222 L280,224 C279,208 274,196 270,188 Z" fill={principal} />
      <path d="M252,112 C272,128 280,160 282,190" stroke="#000000" strokeOpacity=".22" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="114" y="172" width="172" height="28" rx="14" fill={BLANCO} />
      <circle cx="288" cy="228" r="15" fill={BLANCO} />
    </>
  ),

  /*
   * Sombrero de bruja, con la punta doblada, la cinta y la hebilla.
   *
   * La copa cubre la cabeza entera, de hombro a hombro. Antes era angosta y
   * quedaba parada en la punta de la etiqueta, con los hombros asomando a los
   * lados. Se inclina a la izquierda para que el cordón salga por la derecha
   * y siga viéndose como antena en vez de quedar tapado.
   */
  'sombrero-bruja': ({ principal, acento }) => (
    <>
      <path d="M124,190 L166,86 C170,74 162,62 146,58 L130,56 C148,50 170,52 184,66 C192,74 196,86 198,96 L280,190 Z" fill={principal} />
      <path d="M128,180 L136.1,160 L253.8,160 L271.3,180 Z" fill={acento} />
      <path d="M183,158 L207,158 L207,182 L183,182 Z M190,165 L200,165 L200,175 L190,175 Z" fillRule="evenodd" fill="#FFC23D" />
      <ellipse cx="200" cy="190" rx="114" ry="17" fill={principal} />
    </>
  ),

  // Corbatín debajo de la sonrisa. En Independencia: azul, blanco, azul.
  corbatin: ({ principal, acento }) => (
    <>
      <path d="M200,338 L162,318 Q154,338 162,358 Z" fill={principal} />
      <path d="M200,338 L238,318 Q246,338 238,358 Z" fill={principal} />
      <rect x="189" y="327" width="22" height="22" rx="6" fill={acento || BLANCO} />
    </>
  ),

  // Moño en la cabeza, del lado contrario al cordón para no enredarse.
  mono: ({ principal, acento }) => (
    <g transform="rotate(-38 160 150)">
      <path d="M160,150 C144,128 118,134 122,152 C124,168 146,166 160,150 Z" fill={principal} />
      <path d="M160,150 C176,128 202,134 198,152 C196,168 174,166 160,150 Z" fill={principal} />
      <circle cx="160" cy="150" r="9" fill={acento} />
    </g>
  ),

  /*
   * Gorro de fiesta: también cubre la cabeza entera y se inclina a la
   * izquierda, por lo mismo que el de bruja. Franja, ribete abajo y pompón.
   */
  'gorro-fiesta': ({ principal, acento }) => (
    <>
      <path d="M122,196 L170,44 L278,196 Z" fill={principal} />
      <path d="M140.9,136 L146,120 L224,120 L235.4,136 Z" fill={acento} />
      <rect x="116" y="182" width="168" height="20" rx="10" fill={acento} />
      <circle cx="170" cy="42" r="14" fill={acento} />
    </>
  ),

  // El mismo gorro de fiesta, rematado con una estrella en vez del pompón.
  'gorro-estrella': ({ principal, acento }) => (
    <>
      <path d="M122,196 L170,52 L278,196 Z" fill={principal} />
      <path d="M140.9,136 L146,120 L224,120 L235.4,136 Z" fill={acento} />
      <rect x="116" y="182" width="168" height="20" rx="10" fill={acento} />
      <path d={ESTRELLA} fill={acento} />
    </>
  ),

  // Bufanda con su nudo y la punta colgando, con rayas.
  bufanda: ({ principal, acento }) => (
    <>
      <path d="M226,338 L256,334 L266,414 L236,418 Z" fill={principal} />
      <path d="M231,366 L261,362 L263,376 L233,380 Z M234,392 L264,388 L265,398 L235,402 Z" fill={acento} stroke="none" />
      <path d="M112,316 Q200,346 288,316 L288,346 Q200,376 112,346 Z" fill={principal} />
      <path d="M146,328 L146,358 M254,328 L254,358" stroke={acento} strokeWidth="10" fill="none" />
      <path d="M214,334 Q232,328 244,340 Q246,358 228,362 Q212,358 214,334 Z" fill={principal} />
    </>
  ),
};

/*
 * `contorno`: el color del borde de las piezas. Por defecto el de los rasgos
 * (el token que ya se voltea en modo oscuro); el asistente, que pinta a Tiqui
 * con colores fijos, pasa el suyo.
 */
const DisfrazTiqui = ({ disfraz, contorno = 'var(--mascota-rasgo)' }) => {
  const dibujar = disfraz && PIEZAS[disfraz.tipo];
  if (!dibujar) return null;

  return (
    <g className="tiqui-disfraz" data-disfraz={disfraz.tipo}>
      {/* San Valentín: además del moño, anda con los cachetes colorados. */}
      {disfraz.rubor && (
        <g opacity=".55">
          <ellipse cx="150" cy="284" rx="13" ry="8" fill={ROJO_RUBOR} />
          <ellipse cx="250" cy="284" rx="13" ry="8" fill={ROJO_RUBOR} />
        </g>
      )}
      <g stroke={contorno} strokeWidth="4" strokeLinejoin="round" paintOrder="stroke">
        {dibujar(disfraz)}
      </g>
    </g>
  );
};

export default DisfrazTiqui;
