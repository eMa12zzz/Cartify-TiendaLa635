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

import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Package, Store, User } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';

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

  if (tecladoAbierto) return null;

  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(bottom, 10) }]}>
      {APARTADOS.map(({ clave, icono: Icono, nombre }) => {
        const activo = apartado === clave;

        return (
          <Pressable
            key={clave}
            onPress={() => alCambiar(clave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={nombre}
            style={({ pressed }) => [
              estilos.apartado,
              pressed && { backgroundColor: colores.marcaTenue },
            ]}
          >
            <Icono
              size={25}
              color={activo ? colores.marca : COLORES.textoSuave}
              strokeWidth={activo ? 2.4 : 1.8}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.fondo,
    borderTopWidth: 1,
    borderTopColor: COLORES.linea,
    // El relleno de abajo lo pone la franja de gestos (ver arriba); estos 8 son
    // solo el aire de arriba, para que el icono no toque la raya.
    paddingTop: 8,
  },
  apartado: {
    // Cada uno se lleva un cuarto del ancho, toque donde toque el dedo: los
    // huecos entre iconos también cambian de apartado.
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BarraInferior;
