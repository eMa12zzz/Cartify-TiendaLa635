/*
 * ============================================================
 * ¿QUÉ LE PARECIÓ SU PEDIDO? — ValoracionPedido.js
 * ============================================================
 * Puerto de `frontend/src/components/Store/ValoracionPedido.jsx`: cuando un
 * pedido ya está ENTREGADO, el cliente lo califica EN GENERAL —unas estrellas
 * y un comentario para todo el pedido, no producto por producto— y esa
 * calificación se guarda como reseña de cada producto que llevó.
 *
 * Así no queda flotando sin destino y de paso alimenta la nota de cada
 * producto, que es la que ve el resto de la tienda.
 *
 * ── "Ahora no" se recuerda ──
 *
 * La web lo guarda en `localStorage` con una clave por pedido; aquí va al
 * almacén de la app (ver utils/almacen.js) con la misma idea: omitir un
 * pedido no esconde el aviso de los demás, y no se vuelve a preguntar cada
 * vez que se abre ese pedido.
 * ============================================================
 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useColores, useEstilos } from '../../context/ModoContext';
import { useTema } from '../../context/TemaContext';
import { useAviso } from '../../context/AvisoContext';
import { useAuth } from '../../hooks/useAuth';
import { guardarResena } from '../../api/valoracionesApi';
import { guardar, leer, llave } from '../../utils/almacen';
import Boton from '../UI/Boton';
import Estrellas from './Estrellas';

// Una clave por pedido: omitir uno no debe ocultar el aviso de los demás.
const llaveOmitida = (pedidoId) => llave('valoracion', 'omitida', pedidoId);

// Los productos ÚNICOS del pedido: uno puede venir repetido en dos líneas, y
// no se le mandan dos reseñas iguales al servidor.
const productosDelPedido = (items = []) => {
  const vistos = new Set();
  return items
    .map((it) => String(it.productId?._id || it.productId || ''))
    .filter((id) => {
      if (!id || vistos.has(id)) return false;
      vistos.add(id);
      return true;
    });
};

const ValoracionPedido = ({ pedido }) => {
  const { user } = useAuth();
  const { colores } = useTema();
  const COLORES = useColores();
  const estilos = useEstilos(crearEstilos);
  const { avisar } = useAviso();

  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // `null` mientras se lee el almacén: sin ese tercer estado el bloque
  // aparecería un instante antes de descubrir que ya lo habían omitido.
  const [omitido, setOmitido] = useState(null);

  const pedidoId = pedido?._id ? String(pedido._id) : '';

  useEffect(() => {
    if (!pedidoId) return undefined;
    let vivo = true;
    leer(llaveOmitida(pedidoId)).then((valor) => vivo && setOmitido(valor === '1'));
    return () => {
      vivo = false;
    };
  }, [pedidoId]);

  const productos = productosDelPedido(pedido?.items);

  if (pedido?.status !== 'entregado' || !user?.id || productos.length === 0) return null;
  if (omitido !== false) return null;

  const omitir = () => {
    guardar(llaveOmitida(pedidoId), '1');
    setOmitido(true);
  };

  const enviar = async () => {
    if (!estrellas) {
      avisar('Elija cuántas estrellas antes de enviar', 'error');
      return;
    }
    setGuardando(true);
    try {
      // La misma calificación del pedido se guarda para cada producto que llevó.
      await Promise.all(
        productos.map((productId) =>
          guardarResena({ productId, clientId: user.id, rating: estrellas, comment: comentario.trim() })
        )
      );
      setEnviado(true);
      avisar('¡Gracias por calificar su pedido!');
    } catch (e) {
      avisar(e?.message || 'No se pudo guardar su valoración', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>¿Qué le pareció su pedido?</Text>

      {enviado ? (
        <View style={estilos.filaGracias}>
          <Check size={17} color={COLORES.exito} strokeWidth={2.4} />
          <Text style={estilos.gracias}>¡Gracias por calificar su pedido!</Text>
        </View>
      ) : (
        <>
          <Text style={estilos.texto}>
            Su pedido ya llegó. Déjenos saber qué tal estuvo, para que otros vecinos se animen.
          </Text>

          <Estrellas valor={estrellas} alElegir={setEstrellas} tamano={32} soloLectura={guardando} />

          <TextInput
            value={comentario}
            onChangeText={setComentario}
            placeholder="¿Algo que quiera contar? (opcional)"
            placeholderTextColor={COLORES.marcador}
            keyboardAppearance={COLORES.oscuro ? 'dark' : 'light'}
            multiline
            maxLength={500}
            style={estilos.campo}
            accessibilityLabel="Comentario sobre el pedido"
          />

          <Boton
            texto={guardando ? 'Enviando…' : 'Enviar valoración'}
            alPresionar={enviar}
            cargando={guardando}
            color={colores.marca}
            colorPresionado={colores.marcaOscuro}
            estilo={estilos.boton}
          />
          <Pressable onPress={omitir} disabled={guardando} hitSlop={8}>
            <Text style={estilos.ahoraNo}>Ahora no</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const crearEstilos = (COLORES) => StyleSheet.create({
  tarjeta: {
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    padding: 15,
    gap: 10,
    marginBottom: 14,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  texto: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORES.textoSuave,
  },
  filaGracias: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  gracias: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORES.exito,
  },
  campo: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 64,
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORES.texto,
    backgroundColor: COLORES.fondo,
    textAlignVertical: 'top',
  },
  boton: {
    borderRadius: 28,
  },
  ahoraNo: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORES.textoSuave,
    textAlign: 'center',
    paddingVertical: 6,
  },
});

export default ValoracionPedido;
