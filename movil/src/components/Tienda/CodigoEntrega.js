import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck, Store as TiendaIcono, Bike } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';

/*
 * ============================================================
 * EL CÓDIGO DE ENTREGA — CodigoEntrega.js
 * ============================================================
 * Los cuatro dígitos que el cliente dicta al recibir su pedido. Puerto de
 * `frontend/src/components/Store/CodigoEntrega.jsx`, con sus dos versiones:
 * la compacta (una fila chica, para BurbujaPedido y ModalPedido, donde no
 * hay lugar para las cajitas grandes) y la completa (dígitos grandes en
 * cajas, con la explicación de qué es y quién NO lo ve), para Confirmacion.
 *
 * Mismas reglas que la web: sin código no se pinta nada, y un pedido ya
 * entregado o cancelado tampoco lo necesita.
 */
const CodigoEntrega = ({ codigo, deliveryType, estado, compacto = false }) => {
  const { colores } = useTema();

  if (!codigo) return null;
  if (estado === 'entregado' || estado === 'cancelado') return null;

  if (compacto) {
    return (
      <View style={estilos.filaCompacta}>
        <ShieldCheck size={14} color={COLORES.marca} strokeWidth={2.2} />
        <Text style={estilos.etiquetaCompacta}>Código de entrega</Text>
        <Text style={estilos.codigoCompacto}>{codigo}</Text>
      </View>
    );
  }

  const esDomicilio = deliveryType === 'delivery';
  const Icono = esDomicilio ? Bike : TiendaIcono;
  const explicacion = esDomicilio
    ? 'Dígaselos a quien le entregue el pedido en la puerta.'
    : 'Dígaselos en el mostrador al recoger su pedido.';

  // Separados: un "0451" de corrido se lee mal en un teléfono a contraluz.
  const digitos = String(codigo).split('');

  return (
    <View style={[estilos.tarjeta, { backgroundColor: colores.marcaTenue, borderColor: colores.marcaSuave }]}>
      <View style={estilos.filaTitulo}>
        <ShieldCheck size={16} color={colores.marca} strokeWidth={2.2} />
        <Text style={estilos.titulo}>Su código de entrega</Text>
      </View>

      <View style={estilos.filaDigitos}>
        {digitos.map((d, i) => (
          <View key={i} style={estilos.caja}>
            <Text style={estilos.digito}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={estilos.filaExplicacion}>
        <Icono size={14} color={COLORES.textoTenue} strokeWidth={2} style={estilos.iconoExplicacion} />
        <Text style={estilos.explicacion}>
          {explicacion} <Text style={estilos.explicacionTenue}>Nadie de la tienda lo ve en su pantalla: se lo tienen que pedir a usted.</Text>
        </Text>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  filaCompacta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  etiquetaCompacta: {
    fontSize: 11.5,
    color: COLORES.textoSuave,
  },
  codigoCompacto: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    letterSpacing: 3,
    marginLeft: 'auto',
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 11,
  },
  titulo: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
  },
  filaDigitos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 11,
  },
  caja: {
    width: 44,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondo,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
  },
  digito: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
  },
  filaExplicacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  iconoExplicacion: {
    marginTop: 2,
  },
  explicacion: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: COLORES.textoSuave,
  },
  explicacionTenue: {
    color: COLORES.textoTenue,
  },
});

export default CodigoEntrega;
