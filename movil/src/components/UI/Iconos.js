/*
 * ============================================================
 * ICONOS — dibujados a mano con Views
 * ============================================================
 * Los iconos de los FORMULARIOS de sesión (correo, contraseña, DUI, teléfono,
 * la tienda de "seguir viendo"...) ya NO viven aquí: usan `lucide-react-native`,
 * que son los MISMOS iconos que la web dibuja con `lucide-react`. Para esos lo
 * que se buscaba era calzar con el diseño de la web, y nada calza como el mismo
 * trazo.
 *
 * Lo que queda aquí son los iconos de la TIENDA, el carrito y la decoración de
 * temporada: formas simples (una bolsa, una lupa, un copo, un corazón) armadas
 * con rectángulos, círculos y rayas. Cuesta más leerlas que un SVG, pero pesan
 * cero y no atan la tienda a un set concreto — a un copo de fondo no le hace
 * falta ser "el" copo de ninguna librería.
 *
 * Regla al dibujar: solo bordes uniformes (los cuatro lados iguales) y radios
 * uniformes. Android renderiza mal los bordes a medias con esquinas
 * redondeadas, así que las medias lunas se hacen tapando un círculo entero con
 * un contenedor `overflow: 'hidden'`, no con medio borde.
 * ============================================================
 */

import { View } from 'react-native';
import { COLORES } from '../../theme/colores';

const GRIS = COLORES.iconoCampo;

/*
 * Una raya. Es la pieza con la que se arma casi todo: el palito de un numeral,
 * la diagonal del ojo tachado, cada lado de un check.
 */
const Trazo = ({ largo, grosor = 1.6, color, estilo }) => (
  <View
    style={[
      {
        width: largo,
        height: grosor,
        borderRadius: grosor,
        backgroundColor: color,
      },
      estilo,
    ]}
  />
);

/*
 * Media luna: un círculo completo dentro de una caja que le corta la mitad de
 * abajo. Sirve para el arco del candado y para los hombros de la persona.
 */
const Arco = ({ ancho, alto, grosor = 1.6, color, estilo }) => (
  <View style={[{ width: ancho, height: alto, overflow: 'hidden' }, estilo]}>
    <View
      style={{
        width: ancho,
        height: ancho,
        borderRadius: ancho / 2,
        borderWidth: grosor,
        borderColor: color,
      }}
    />
  </View>
);

// ── La persona (barra de la tienda) y el pin ────────────────

export const Persona = ({ size = 18, color = GRIS }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size * 0.42,
        height: size * 0.42,
        borderRadius: size * 0.21,
        borderWidth: 1.6,
        borderColor: color,
        marginBottom: 1.5,
      }}
    />
    <Arco ancho={size * 0.8} alto={size * 0.34} color={color} />
  </View>
);

export const Pin = ({ size = 18, color = GRIS }) => {
  const bola = size * 0.68;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: bola,
          height: bola,
          borderRadius: bola / 2,
          borderWidth: 1.6,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, backgroundColor: color }} />
      </View>
      {/* La punta que clava el pin en el mapa. */}
      <View
        style={{
          width: 0,
          height: 0,
          marginTop: -1,
          borderLeftWidth: size * 0.17,
          borderRightWidth: size * 0.17,
          borderTopWidth: size * 0.26,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
    </View>
  );
};

/*
 * El ojo de "mostrar contraseña" NO se dibuja aquí: usa `Eye`/`EyeOff` de
 * lucide-react-native directamente en CampoTexto —los mismos iconos que la web—.
 * Ver components/UI/CampoTexto.js.
 */

// ── Los de adorno (barra de arriba y lista de ventajas) ─────

export const Tienda = ({ size = 15, color = GRIS }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
    {/* El toldo. */}
    <View
      style={{
        width: size,
        height: size * 0.26,
        borderRadius: 2,
        backgroundColor: color,
        marginBottom: 1.5,
      }}
    />
    <View
      style={{
        width: size * 0.84,
        height: size * 0.54,
        borderWidth: 1.6,
        borderColor: color,
        borderRadius: 2,
      }}
    />
  </View>
);

export const Flecha = ({ size = 16, color = '#FFFFFF' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Trazo largo={size * 0.78} grosor={1.9} color={color} />
    <Trazo
      largo={size * 0.36}
      grosor={1.9}
      color={color}
      estilo={{ position: 'absolute', right: size * 0.06, top: size * 0.32, transform: [{ rotate: '45deg' }] }}
    />
    <Trazo
      largo={size * 0.36}
      grosor={1.9}
      color={color}
      estilo={{ position: 'absolute', right: size * 0.06, bottom: size * 0.32, transform: [{ rotate: '-45deg' }] }}
    />
  </View>
);

export const Bici = ({ size = 16, color = COLORES.marca }) => {
  const rueda = size * 0.44;
  return (
    <View style={{ width: size, height: size, justifyContent: 'flex-end' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ width: rueda, height: rueda, borderRadius: rueda / 2, borderWidth: 1.5, borderColor: color }} />
        <View style={{ width: rueda, height: rueda, borderRadius: rueda / 2, borderWidth: 1.5, borderColor: color }} />
      </View>
      {/* El cuadro: dos rayas cruzadas sobre las ruedas. */}
      <Trazo
        largo={size * 0.5}
        grosor={1.5}
        color={color}
        estilo={{ position: 'absolute', top: size * 0.34, left: size * 0.14, transform: [{ rotate: '-40deg' }] }}
      />
      <Trazo
        largo={size * 0.5}
        grosor={1.5}
        color={color}
        estilo={{ position: 'absolute', top: size * 0.34, right: size * 0.14, transform: [{ rotate: '40deg' }] }}
      />
      <Trazo largo={size * 0.5} grosor={1.5} color={color} estilo={{ position: 'absolute', top: size * 0.2, left: size * 0.25 }} />
    </View>
  );
};

/*
 * La estrella son cinco puntas iguales giradas de 72 en 72 grados.
 *
 * Cada punta se empuja hacia afuera con un `translateY` DESPUÉS del giro, que
 * es lo que la manda a lo largo de su propio eje. Sin ese empujón las cinco se
 * pisan en el centro y el dibujo queda hecho un pentágono relleno; y anchas
 * tampoco sirven, porque el relleno se come los huecos entre puntas.
 */
export const Estrella = ({ size = 16, color = COLORES.marca }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {[0, 72, 144, 216, 288].map((grados) => (
      <View
        key={grados}
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.16,
          borderRightWidth: size * 0.16,
          borderBottomWidth: size * 0.46,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          transform: [{ rotate: `${grados}deg` }, { translateY: -size * 0.17 }],
        }}
      />
    ))}
  </View>
);

/*
 * El corazón clásico: un cuadrado girado 45 grados y dos bolitas del mismo
 * ancho apoyadas en sus dos lados de arriba. Las cuentas de abajo son las que
 * dejan las bolitas justo sobre esos lados —a ojo quedan descentradas y el
 * dibujo se ve como un borrón.
 */
export const Corazon = ({ size = 16, color = COLORES.marca }) => {
  const lado = size * 0.55;
  const centroY = size * 0.58;
  // Media diagonal del cuadrado: cuánto hay que correr cada bolita.
  const corrimiento = lado * 0.354;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          width: lado,
          height: lado,
          backgroundColor: color,
          left: size / 2 - lado / 2,
          top: centroY - lado / 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: lado,
          height: lado,
          borderRadius: lado / 2,
          backgroundColor: color,
          left: size / 2 - corrimiento - lado / 2,
          top: centroY - corrimiento - lado / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: lado,
          height: lado,
          borderRadius: lado / 2,
          backgroundColor: color,
          left: size / 2 + corrimiento - lado / 2,
          top: centroY - corrimiento - lado / 2,
        }}
      />
    </View>
  );
};

export const Check = ({ size = 12, color = '#FFFFFF' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Trazo
      largo={size * 0.44}
      grosor={2}
      color={color}
      estilo={{ position: 'absolute', left: size * 0.02, top: size * 0.56, transform: [{ rotate: '45deg' }] }}
    />
    <Trazo
      largo={size * 0.76}
      grosor={2}
      color={color}
      estilo={{ position: 'absolute', right: size * 0.02, top: size * 0.44, transform: [{ rotate: '-50deg' }] }}
    />
  </View>
);

// ── Los de la tienda y el carrito ───────────────────────────

export const Lupa = ({ size = 18, color = GRIS, grosor = 1.7 }) => {
  const lente = size * 0.66;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: lente,
          height: lente,
          borderRadius: lente / 2,
          borderWidth: grosor,
          borderColor: color,
        }}
      />
      {/* El mango sale de la esquina de abajo a la derecha del lente. */}
      <Trazo
        largo={size * 0.34}
        grosor={grosor}
        color={color}
        estilo={{
          position: 'absolute',
          right: 0,
          bottom: size * 0.13,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

/*
 * La bolsa de la compra. Es el icono del carrito en toda la tienda —la web usa
 * ShoppingBag, no un carrito de supermercado— y se arma con el cuerpo
 * rectangular y el asa como medio círculo asomando por arriba.
 */
export const Bolsa = ({ size = 20, color = GRIS, grosor = 1.7 }) => {
  const cuerpo = size * 0.74;
  const asa = size * 0.36;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* El asa: un círculo al que la caja de arriba le corta la mitad de abajo. */}
      <Arco ancho={asa} alto={asa / 2} grosor={grosor} color={color} estilo={{ marginBottom: -1 }} />
      <View
        style={{
          width: cuerpo,
          height: size * 0.62,
          borderWidth: grosor,
          borderColor: color,
          borderRadius: 3,
        }}
      />
    </View>
  );
};

export const Mas = ({ size = 14, color = '#FFFFFF', grosor = 2 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Trazo largo={size * 0.82} grosor={grosor} color={color} estilo={{ position: 'absolute' }} />
    <View
      style={{
        position: 'absolute',
        width: grosor,
        height: size * 0.82,
        borderRadius: grosor,
        backgroundColor: color,
      }}
    />
  </View>
);

export const Menos = ({ size = 14, color = '#FFFFFF', grosor = 2 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Trazo largo={size * 0.82} grosor={grosor} color={color} />
  </View>
);

export const Equis = ({ size = 16, color = GRIS, grosor = 1.8 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Trazo
      largo={size * 0.82}
      grosor={grosor}
      color={color}
      estilo={{ position: 'absolute', transform: [{ rotate: '45deg' }] }}
    />
    <Trazo
      largo={size * 0.82}
      grosor={grosor}
      color={color}
      estilo={{ position: 'absolute', transform: [{ rotate: '-45deg' }] }}
    />
  </View>
);

export const Basura = ({ size = 15, color = GRIS, grosor = 1.5 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
    {/* La agarradera de la tapa, y la tapa. */}
    <Trazo largo={size * 0.3} grosor={grosor} color={color} />
    <Trazo largo={size * 0.86} grosor={grosor} color={color} estilo={{ marginTop: 1.5 }} />
    <View
      style={{
        width: size * 0.66,
        height: size * 0.6,
        borderWidth: grosor,
        borderColor: color,
        borderRadius: 2,
        marginTop: 1.5,
      }}
    />
  </View>
);

/*
 * El marcador de "este producto no tiene foto". La caja con la raya del centro
 * es lo que la hace leerse como un paquete y no como un cuadrado a secas.
 */
export const Paquete = ({ size = 30, color = '#C4BDB6', grosor = 1.5 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size * 0.84,
        height: size * 0.72,
        borderWidth: grosor,
        borderColor: color,
        borderRadius: 3,
        alignItems: 'center',
      }}
    >
      {/* La cinta: la raya de arriba y el tirito que baja. */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.2,
          width: '100%',
          height: grosor,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          width: grosor,
          height: size * 0.2,
          backgroundColor: color,
        }}
      />
    </View>
  </View>
);

/* El reloj del vencimiento de una promoción: "Quedan 3 días". */
export const Reloj = ({ size = 12, color = GRIS, grosor = 1.4 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: grosor,
        borderColor: color,
      }}
    />
    {/* Las agujas salen del centro: por eso se anclan al 50% y crecen hacia
        un lado con transformOrigin fingido — un margen negativo del largo. */}
    <View
      style={{
        position: 'absolute',
        width: grosor,
        height: size * 0.26,
        backgroundColor: color,
        borderRadius: grosor,
        top: size * 0.24,
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: size * 0.24,
        height: grosor,
        backgroundColor: color,
        borderRadius: grosor,
        left: size * 0.5,
        top: size * 0.5 - grosor / 2,
      }}
    />
  </View>
);

// ── Las figuras que caen en temporada ──────────────────────
/*
 * Van muy tenues y de fondo (ver DecoracionTemporada), así que aquí importa la
 * silueta y no el detalle: a 14 píxeles y al 30% de opacidad, un copo con seis
 * brazos y un copo con tres se ven igual. Lo que sí tiene que leerse es QUÉ
 * cosa es, de un vistazo y de reojo.
 */

export const Copo = ({ size = 14, color = '#FFFFFF' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {[0, 60, 120].map((grados) => (
      <Trazo
        key={grados}
        largo={size}
        grosor={1.4}
        color={color}
        estilo={{ position: 'absolute', transform: [{ rotate: `${grados}deg` }] }}
      />
    ))}
  </View>
);

/*
 * El murciélago: el cuerpo al centro y las alas como dos triángulos que salen
 * hacia arriba y afuera. Con los triángulos apuntando hacia abajo parecía un
 * moño, que era lo que salía al primer intento.
 */
export const Murcielago = ({ size = 16, color = '#FFFFFF' }) => {
  const ala = size * 0.42;
  return (
    <View style={{ width: size, height: size * 0.6, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.22,
          height: size * 0.34,
          borderRadius: size * 0.11,
          backgroundColor: color,
        }}
      />
      {[-1, 1].map((lado) => (
        <View
          key={lado}
          style={{
            position: 'absolute',
            [lado === -1 ? 'left' : 'right']: 0,
            top: size * 0.06,
            width: 0,
            height: 0,
            borderTopWidth: ala * 0.62,
            borderBottomWidth: ala * 0.28,
            [lado === -1 ? 'borderRightWidth' : 'borderLeftWidth']: ala,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            [lado === -1 ? 'borderRightColor' : 'borderLeftColor']: color,
          }}
        />
      ))}
    </View>
  );
};

/* Un papelito de confeti: un rectángulo torcido. No necesita ser más. */
export const Confeti = ({ size = 10, color = '#FFFFFF' }) => (
  <View
    style={{
      width: size * 0.5,
      height: size,
      borderRadius: 1.5,
      backgroundColor: color,
      transform: [{ rotate: '24deg' }],
    }}
  />
);

/* La flecha de "atrás" de la barra del carrito. */
export const ChevronIzquierda = ({ size = 18, color = COLORES.texto, grosor = 1.9 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Trazo
      largo={size * 0.46}
      grosor={grosor}
      color={color}
      estilo={{ position: 'absolute', top: size * 0.32, transform: [{ rotate: '-45deg' }] }}
    />
    <Trazo
      largo={size * 0.46}
      grosor={grosor}
      color={color}
      estilo={{ position: 'absolute', bottom: size * 0.32, transform: [{ rotate: '45deg' }] }}
    />
  </View>
);
