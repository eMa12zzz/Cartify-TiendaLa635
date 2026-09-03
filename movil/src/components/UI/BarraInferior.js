/*
 * ============================================================
 * BARRA INFERIOR — los apartados de la app
 * ============================================================
 * Cuatro apartados fijos abajo: la tienda, el asistente por voz, los pedidos y
 * la cuenta. Es la navegación principal de la app y reemplaza al botón de la
 * persona que vivía en la barra de arriba, que era la única puerta a la cuenta.
 *
 * ── Por qué abajo y solo con iconos ──
 *
 * Porque es donde alcanza el pulgar. Arriba caben el nombre de la tienda y el
 * carrito, pero un cuarto botón más allá de la mitad de la pantalla obliga a
 * recolocar el teléfono en la mano cada vez que se cambia de apartado.
 *
 * Sin texto debajo de cada icono, como Instagram: son cuatro, están siempre en
 * el mismo lugar y el que está encendido lo dice el color. Las etiquetas no
 * desaparecen del todo —viajan en `accessibilityLabel`—, así que quien use el
 * lector de pantalla sigue oyendo "Mis pedidos" y no "botón".
 *
 * ── El encendido va en el color y el grosor, no en el relleno ──
 *
 * Instagram rellena el icono activo. Aquí no se puede copiar tal cual: los de
 * lucide son de TRAZO, y rellenar el paquete de "Pedidos" tapa las mismas rayas
 * que lo hacen leerse como una caja — queda un rectángulo negro. Así que el
 * apartado abierto se marca con el café de la temporada y un trazo más grueso,
 * que es lo que se nota de reojo sin romper el dibujo.
 *
 * ── Los iconos son los de la web ──
 *
 * Los mismos de `lucide-react` que usa el frontend, en su versión nativa:
 *   Store   la tienda        (ClienteLayout, botón "Ir a la tienda")
 *   Mic     el asistente     (HeaderTienda y AsistenteVoz)
 *   User    la cuenta        (HeaderTienda, "Mi Cuenta")
 *   Package los pedidos      (MisPedidos)
 *
 * En la web el ítem de "Pedidos" del menú lateral usa ShoppingBag, pero aquí ese
 * dibujo YA es el carrito de la barra de arriba: dos bolsas idénticas a un
 * centímetro una de otra, significando cosas distintas, es peor que cambiar de
 * icono. Se usa el Package con el que la propia web pinta "Aún no tienes
 * pedidos", que además es lo que llega a la puerta.
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Package, Store, User } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';

// Las medidas de la píldora flotante, juntas porque las usa el StyleSheet
// de aquí abajo para armar el mismo tamaño en más de un lugar — y porque
// la que se desliza (más abajo) necesita las mismas cuentas para saber
// dónde parar.
const ALTO_ICONO = 52;
const RELLENO_VERTICAL_BARRA = 6;
const RELLENO_HORIZONTAL_BARRA = 6;
const ANCHO_PILDORA = 56;
const ALTO_PILDORA = 50;
const RADIO_PILDORA = 25;
const AIRE_ARRIBA = 10;
export const AIRE_ABAJO_MINIMO = 14;

// Exportada para que una hoja que sube desde abajo (MenuPasillos, y
// cualquier otra que se sume) le reserve este alto exacto a su último
// renglón. A diferencia de las pantallas del Tab —que dejan que la barra
// flote LIBRE por encima, a propósito—, una hoja sí termina en un borde
// fijo: si ese borde cae bajo la píldora, el toque ahí lo captura la
// píldora (que se pinta después, fuera del árbol de la hoja) y no el
// renglón que se ve debajo.
export const ALTURA_BARRA_FLOTANTE = RELLENO_VERTICAL_BARRA * 2 + ALTO_ICONO + AIRE_ARRIBA;

/*
 * El orden importa y no es alfabético: la tienda primero porque es a lo que se
 * viene, y la cuenta al final porque es a lo que se entra de vez en cuando. En
 * medio, lo que se usa mientras se compra.
 */
export const APARTADOS = [
  { clave: 'inicio', icono: Store, nombre: 'Tienda' },
  { clave: 'asistente', icono: Mic, nombre: 'Asistente por voz' },
  { clave: 'pedidos', icono: Package, nombre: 'Mis pedidos' },
  { clave: 'perfil', icono: User, nombre: 'Mi cuenta' },
];

/*
 * Con el teclado abierto la barra estorba.
 *
 * En Android el sistema encoge la ventana, así que la barra sube y se queda
 * flotando sobre el teclado, comiéndose 56 píxeles de los pocos que le quedan a
 * la lista de productos mientras se escribe en el buscador. En iOS pasa lo
 * contrario —se queda quieta y el teclado la tapa—, que es igual de inútil.
 * Escondida en los dos casos: mientras se escribe no se cambia de apartado.
 *
 * Los eventos son distintos por plataforma a propósito: los `will` de iOS
 * avisan ANTES de la animación y la barra se va junto con ella; en Android esos
 * eventos no existen y hay que usar los `did`.
 */
const useTecladoAbierto = () => {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const mostrar = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const ocultar = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subeAbre = Keyboard.addListener(mostrar, () => setAbierto(true));
    const subeCierra = Keyboard.addListener(ocultar, () => setAbierto(false));

    return () => {
      subeAbre.remove();
      subeCierra.remove();
    };
  }, []);

  return abierto;
};

const BarraInferior = ({ apartado, alCambiar }) => {
  const { colores } = useTema();
  /*
   * Lo que mide la franja de gestos de abajo (la rayita del iPhone, la barra de
   * navegación de Android). Hace falta de verdad y no es un adorno: `app.json`
   * trae `edgeToEdgeEnabled`, así que en Android la app se dibuja HASTA el
   * borde y sin este relleno los iconos quedan debajo de los botones del
   * sistema. El `Math.max` es para los teléfonos que no reservan nada y
   * devuelven 0: pegada al filo, la barra se toca mal.
   */
  const { bottom } = useSafeAreaInsets();
  const tecladoAbierto = useTecladoAbierto();

  const indiceActivo = Math.max(APARTADOS.findIndex((a) => a.clave === apartado), 0);

  /*
   * La píldora que se desliza. Es UNA sola vista, no una por apartado: se
   * mueve de columna en columna en vez de aparecer/desaparecer en cada una,
   * que es lo que la hace leerse como que "viaja" y no como que parpadea.
   *
   * El destino se calcula, no se mide con onLayout en cada icono: las
   * cuatro columnas son `flex: 1` a partes iguales, así que con el ancho
   * de la barra alcanza. Ese ancho SÍ hace falta medirlo (varía por
   * teléfono), así que hasta que `onLayout` no contesta la píldora no
   * tiene dónde pararse — por eso `anchoBarraRef` empieza en 0 y todo lo
   * demás espera a que deje de estarlo.
   */
  const anchoBarraRef = useRef(0);
  const pildoraX = useRef(new Animated.Value(0)).current;
  const yaUbicada = useRef(false);

  const calcularDestino = (indice, anchoBarra) => {
    const anchoColumna = (anchoBarra - RELLENO_HORIZONTAL_BARRA * 2) / APARTADOS.length;
    return RELLENO_HORIZONTAL_BARRA + indice * anchoColumna + (anchoColumna - ANCHO_PILDORA) / 2;
  };

  useEffect(() => {
    if (!yaUbicada.current || anchoBarraRef.current <= 0) return;
    Animated.timing(pildoraX, {
      toValue: calcularDestino(indiceActivo, anchoBarraRef.current),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [indiceActivo]);

  if (tecladoAbierto) return null;

  return (
    // La franja de gestos ya no es padding DENTRO de la barra: es aire AFUERA,
    // para que la píldora quede flotando por encima y no pegada al filo.
    <View style={[estilos.envoltorio, { paddingBottom: Math.max(bottom, AIRE_ABAJO_MINIMO) }]}>
      <View
        style={estilos.barra}
        onLayout={(e) => {
          const ancho = e.nativeEvent.layout.width;
          anchoBarraRef.current = ancho;
          // La primera vez no se anima: la píldora aparece ya puesta en el
          // apartado activo, no viaja desde el borde apenas se abre la app.
          pildoraX.setValue(calcularDestino(indiceActivo, ancho));
          yaUbicada.current = true;
        }}
      >
        {/*
          La píldora en sí: UNA vista detrás de los cuatro iconos, no una
          por apartado. `pointerEvents="none"` para que no le robe el toque
          a lo que tiene encima — la Pressable de cada apartado sigue siendo
          la columna entera.
        */}
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.pildoraActiva,
            { backgroundColor: colores.marca, transform: [{ translateX: pildoraX }] },
          ]}
        />

        {APARTADOS.map(({ clave, icono: Icono, nombre }) => {
          const activo = apartado === clave;

          return (
            <Pressable
              key={clave}
              onPress={() => alCambiar(clave)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={nombre}
              style={estilos.apartado}
            >
              {({ pressed }) => (
                // Ya no lleva su propio fondo cuando está activo: eso lo
                // pinta la píldora que se desliza por detrás. Aquí solo
                // queda el tinte de "lo estoy tocando" en los inactivos.
                <View
                  style={[estilos.pastillaIcono, !activo && pressed && { backgroundColor: colores.marcaTenue }]}
                >
                  <Icono
                    size={23}
                    color={activo ? '#FFFFFF' : COLORES.textoSuave}
                    strokeWidth={activo ? 2.2 : 1.8}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  // Absoluta: flota ENCIMA de la pantalla del apartado en vez de empujarla
  // a su propio renglón. Las pantallas ya no necesitan reservarle espacio.
  envoltorio: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: AIRE_ARRIBA,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.fondo,
    borderRadius: 30,
    paddingVertical: RELLENO_VERTICAL_BARRA,
    paddingHorizontal: RELLENO_HORIZONTAL_BARRA,
    // La sombra es lo que la hace leerse como que flota y no como una barra
    // pegada al borde de siempre.
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  apartado: {
    // Cada uno se lleva un cuarto del ancho, toque donde toque el dedo: los
    // huecos entre iconos también cambian de apartado.
    flex: 1,
    height: ALTO_ICONO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastillaIcono: {
    width: ANCHO_PILDORA,
    height: ALTO_PILDORA,
    // La mitad del alto: esquinas totalmente redondas (píldora), no la
    // esquina suavizada de antes que se leía como un cuadrado.
    borderRadius: RADIO_PILDORA,
    // Sin esto, Android solo recorta bien la esquina la primera vez que se
    // pinta la vista. El apartado que ya nace activo (Tienda) se ve redondo
    // porque su fondo se pintó así desde el primer cuadro; los que se
    // activan DESPUÉS —al tocar Asistente, Pedidos o Perfil— cambian el
    // backgroundColor sobre una vista ya pintada, y sin overflow:'hidden'
    // Android no vuelve a recortar: el fondo se ve casi cuadrado.
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // La misma forma que `pastillaIcono`, pero sin overflow:'hidden': ese
  // truco hacía falta porque el backgroundColor de aquella vista CAMBIABA
  // después del primer pintado (de transparente a marca). Esta píldora no
  // — nace con colores.marca puesto y de ahí solo se mueve con transform
  // — así que nunca dispara el bug de Android que el overflow arregla.
  pildoraActiva: {
    position: 'absolute',
    top: RELLENO_VERTICAL_BARRA + (ALTO_ICONO - ALTO_PILDORA) / 2,
    left: 0,
    width: ANCHO_PILDORA,
    height: ALTO_PILDORA,
    borderRadius: RADIO_PILDORA,
  },
});

export default BarraInferior;
