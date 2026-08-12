/*
 * ============================================================
 * ICONOS DE "MI CUENTA" — dibujados con Views
 * ============================================================
 * La web pinta estos iconos con `lucide-react` (SVG del navegador, que no
 * existe en React Native). Siguiendo la misma decisión que
 * `components/UI/Iconos.js` —no traer una librería de iconos— aquí se dibujan
 * a mano con rectángulos, círculos y rayas. Pesan cero y se ven igual en
 * cualquier teléfono.
 *
 * Todos reciben { size, color } para poder recolorearlos según la paleta del
 * cliente (el café #8B5A2B, el rojo de eliminar, etc.).
 * ============================================================
 */
import { View, Text } from 'react-native';

// La pieza básica: una raya (recta, con opción de rotarla o posicionarla).
const Raya = ({ w, h = 1.8, color, style }) => (
  <View style={[{ width: w, height: h, borderRadius: h, backgroundColor: color }, style]} />
);

// Marco reutilizable para centrar el dibujo dentro de una caja cuadrada.
const Caja = ({ size, children, style }) => (
  <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
    {children}
  </View>
);

// ── Pestañas del menú y estados ──────────────────────────────

// Bolsa de compras (Pedidos).
export const IconoBolsa = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    <View
      style={{
        width: size * 0.72, height: size * 0.66,
        borderWidth: 1.8, borderColor: color, borderRadius: 3,
        marginTop: size * 0.24,
      }}
    />
    {/* El asa: media luna arriba de la bolsa. */}
    <View
      style={{
        position: 'absolute', top: size * 0.14,
        width: size * 0.36, height: size * 0.36,
        borderWidth: 1.8, borderColor: color,
        borderTopLeftRadius: size * 0.18, borderTopRightRadius: size * 0.18,
        borderBottomWidth: 0,
      }}
    />
  </Caja>
);

// Tarjeta de crédito (Pagos).
export const IconoTarjeta = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    <View
      style={{
        width: size * 0.9, height: size * 0.62,
        borderWidth: 1.8, borderColor: color, borderRadius: 3,
        justifyContent: 'flex-start', paddingTop: size * 0.14,
      }}
    >
      <Raya w={size * 0.9} h={size * 0.1} color={color} />
    </View>
  </Caja>
);

// Billetera (efectivo).
export const IconoBilletera = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    <View
      style={{
        width: size * 0.9, height: size * 0.66,
        borderWidth: 1.8, borderColor: color, borderRadius: 4,
        alignItems: 'flex-end', justifyContent: 'center', paddingRight: size * 0.12,
      }}
    >
      <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, backgroundColor: color }} />
    </View>
  </Caja>
);

// Campana (Avisos).
export const IconoCampana = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    {/* El cuerpo: cúpula redondeada arriba y recta abajo. */}
    <View
      style={{
        width: size * 0.6, height: size * 0.58,
        borderWidth: 1.8, borderColor: color,
        borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3,
        marginBottom: 1.5,
      }}
    />
    <Raya w={size * 0.74} h={1.8} color={color} />
    {/* El badajo. */}
    <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, borderWidth: 1.8, borderColor: color, marginTop: 1.5 }} />
  </Caja>
);

// Recibo (Recibos).
export const IconoRecibo = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    <View
      style={{
        width: size * 0.66, height: size * 0.86,
        borderWidth: 1.8, borderColor: color, borderRadius: 2,
        alignItems: 'center', justifyContent: 'center', gap: size * 0.1,
      }}
    >
      <Raya w={size * 0.4} color={color} />
      <Raya w={size * 0.4} color={color} />
      <Raya w={size * 0.28} color={color} />
    </View>
  </Caja>
);

// Círculo de ayuda con signo de interrogación (Ayuda).
export const IconoAyuda = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    <View
      style={{
        width: size * 0.9, height: size * 0.9, borderRadius: size * 0.45,
        borderWidth: 1.8, borderColor: color, alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontSize: size * 0.56, fontWeight: '700', lineHeight: size * 0.66 }}>?</Text>
    </View>
  </Caja>
);

// Salir de sesión: un recuadro con una flecha que sale hacia la derecha.
export const IconoSalir = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    {/* El marco de la puerta, abierto del lado derecho. */}
    <View
      style={{
        position: 'absolute', left: size * 0.06,
        width: size * 0.44, height: size * 0.8,
        borderWidth: 1.8, borderColor: color, borderRadius: 2,
        borderRightWidth: 0,
      }}
    />
    {/* La flecha saliendo. */}
    <Raya w={size * 0.42} color={color} style={{ position: 'absolute', right: size * 0.06, top: size * 0.5 - 0.9 }} />
    <Raya w={size * 0.22} color={color} style={{ position: 'absolute', right: size * 0.06, top: size * 0.34, transform: [{ rotate: '45deg' }] }} />
    <Raya w={size * 0.22} color={color} style={{ position: 'absolute', right: size * 0.06, top: size * 0.66, transform: [{ rotate: '-45deg' }] }} />
  </Caja>
);

// Caja/paquete (estados vacíos de pedidos y reparto).
export const IconoPaquete = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    <View style={{ width: size * 0.82, height: size * 0.74, borderWidth: 1.8, borderColor: color, borderRadius: 3 }} />
    {/* La cinta de arriba y la costura del medio. */}
    <Raya w={size * 0.82} color={color} style={{ position: 'absolute', top: size * 0.4 }} />
    <View style={{ position: 'absolute', top: size * 0.13, width: 1.8, height: size * 0.28, backgroundColor: color }} />
  </Caja>
);

// Bote de basura (eliminar).
export const IconoBasura = ({ size = 18, color = '#dc2626' }) => (
  <Caja size={size}>
    {/* Tapa + manija. */}
    <Raya w={size * 0.7} color={color} style={{ marginBottom: 1 }} />
    <View style={{ position: 'absolute', top: size * 0.1, width: size * 0.24, height: size * 0.1, borderWidth: 1.6, borderColor: color, borderBottomWidth: 0 }} />
    {/* Cuerpo con dos rayas. */}
    <View
      style={{
        width: size * 0.56, height: size * 0.6,
        borderWidth: 1.8, borderColor: color,
        borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
        flexDirection: 'row', justifyContent: 'center', gap: size * 0.1, paddingTop: size * 0.1,
      }}
    >
      <View style={{ width: 1.6, height: size * 0.34, backgroundColor: color }} />
      <View style={{ width: 1.6, height: size * 0.34, backgroundColor: color }} />
    </View>
  </Caja>
);

// Signo de más (agregar).
export const IconoMas = ({ size = 18, color = '#fff' }) => (
  <Caja size={size}>
    <Raya w={size * 0.7} h={2} color={color} style={{ position: 'absolute' }} />
    <Raya w={size * 0.7} h={2} color={color} style={{ position: 'absolute', transform: [{ rotate: '90deg' }] }} />
  </Caja>
);

// Regalo (saldo de tarjetas).
export const IconoRegalo = ({ size = 18, color = '#666' }) => (
  <Caja size={size}>
    <View style={{ width: size * 0.82, height: size * 0.56, borderWidth: 1.8, borderColor: color, borderRadius: 2, marginTop: size * 0.18 }} />
    {/* El lazo: dos bolitas arriba y la cinta vertical. */}
    <View style={{ position: 'absolute', top: size * 0.06, flexDirection: 'row', gap: 1 }}>
      <View style={{ width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09, borderWidth: 1.6, borderColor: color }} />
      <View style={{ width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09, borderWidth: 1.6, borderColor: color }} />
    </View>
    <View style={{ position: 'absolute', top: size * 0.22, width: 1.8, height: size * 0.56, backgroundColor: color }} />
  </Caja>
);

// Poste con letrero (referencia de una dirección).
export const IconoLetrero = ({ size = 18, color = '#9ca3af' }) => (
  <Caja size={size}>
    <View style={{ position: 'absolute', width: 1.8, height: size * 0.86, backgroundColor: color }} />
    <View style={{ position: 'absolute', top: size * 0.16, left: size * 0.2, width: size * 0.6, height: size * 0.22, borderWidth: 1.6, borderColor: color, borderRadius: 2 }} />
  </Caja>
);

// Triángulo de alerta con signo de admiración.
export const IconoAlerta = ({ size = 18, color = '#b45309' }) => (
  <Caja size={size}>
    <View
      style={{
        width: 0, height: 0,
        borderLeftWidth: size * 0.5, borderRightWidth: size * 0.5,
        borderBottomWidth: size * 0.82,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
      }}
    />
    <Text style={{ position: 'absolute', bottom: size * 0.02, color: '#fff', fontSize: size * 0.5, fontWeight: '800' }}>!</Text>
  </Caja>
);

// Círculo con check (pedido recibido).
export const IconoCheckCirculo = ({ size = 18, color = '#16a34a' }) => (
  <Caja size={size}>
    <View style={{ width: size * 0.9, height: size * 0.9, borderRadius: size * 0.45, borderWidth: 1.8, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Raya w={size * 0.24} h={2} color={color} style={{ position: 'absolute', left: size * 0.24, top: size * 0.5, transform: [{ rotate: '45deg' }] }} />
      <Raya w={size * 0.42} h={2} color={color} style={{ position: 'absolute', right: size * 0.2, top: size * 0.44, transform: [{ rotate: '-50deg' }] }} />
    </View>
  </Caja>
);

// Burbuja de mensaje (WhatsApp).
export const IconoMensaje = ({ size = 18, color = '#8B5A2B' }) => (
  <Caja size={size}>
    <View style={{ width: size * 0.86, height: size * 0.66, borderWidth: 1.8, borderColor: color, borderRadius: size * 0.18 }} />
    {/* La colita de la burbuja abajo a la izquierda. */}
    <View
      style={{
        position: 'absolute', bottom: size * 0.14, left: size * 0.24,
        width: 0, height: 0,
        borderTopWidth: size * 0.2, borderRightWidth: size * 0.2,
        borderTopColor: color, borderRightColor: 'transparent',
      }}
    />
  </Caja>
);

// Flecha de navegación (Cómo llegar): un triángulo apuntando arriba-derecha.
export const IconoNavegar = ({ size = 18, color = '#fff' }) => (
  <Caja size={size}>
    <View
      style={{
        width: 0, height: 0,
        borderLeftWidth: size * 0.36, borderRightWidth: size * 0.36,
        borderBottomWidth: size * 0.68,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  </Caja>
);

export default {
  IconoBolsa, IconoTarjeta, IconoBilletera, IconoCampana, IconoRecibo,
  IconoAyuda, IconoSalir, IconoPaquete, IconoBasura, IconoMas, IconoRegalo,
  IconoLetrero, IconoAlerta, IconoCheckCirculo, IconoMensaje, IconoNavegar,
};
