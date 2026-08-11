/*
 * ============================================================
 * SECCIÓN — el "Ver todos" de una fila de la portada
 * ============================================================
 * La misma cuadrícula de dos columnas de la portada, con los productos de una
 * sola sección. Existe porque una fila deslizable muestra 12 y las secciones
 * suelen tener más: sin esta pantalla, "Ver todos (24)" no llevaría a ningún
 * lado y los otros 12 serían inalcanzables.
 *
 * No recalcula nada: recibe la sección ya armada. Rearmarla aquí con el
 * catálogo abriría la puerta a que esta pantalla y la fila que la abrió
 * mostraran cosas distintas si el criterio cambiara en uno de los dos lados.
 * ============================================================
 */

import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../theme/colores';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useTema } from '../context/TemaContext';
import { ChevronIzquierda } from '../components/UI/Iconos';
import TarjetaProducto from '../components/Tienda/TarjetaProducto';

const Seccion = ({ seccion, alVolver, alVerDetalle, alAgregar }) => {
  const { colores } = useTema();
  const productos = seccion?.todos || seccion?.productos || [];

  return (
    <View style={estilos.pantalla}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <Pressable
          onPress={alVolver}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver a la tienda"
          style={({ pressed }) => [
            estilos.botonVolver,
            pressed && { backgroundColor: colores.marcaSuave },
          ]}
        >
          <ChevronIzquierda size={18} />
        </Pressable>

        <View style={estilos.titulos}>
          <Text style={estilos.titulo} numberOfLines={1}>{seccion?.titulo}</Text>
          <Text style={estilos.conteo}>
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          </Text>
        </View>
      </View>

      <FlatList
        data={productos}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={estilos.fila}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) => (
          <View style={estilos.celda}>
            <TarjetaProducto producto={item} alVerDetalle={alVerDetalle} alAgregar={alAgregar} />
          </View>
        )}
      />
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
  },
  botonVolver: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulos: {
    flexShrink: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.2,
  },
  conteo: {
    fontSize: 12.5,
    color: COLORES.subtitulo,
  },
  lista: {
    paddingTop: 16,
    paddingBottom: 28,
  },
  fila: {
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  celda: {
    flex: 1,
    maxWidth: '48.5%',
  },
});

export default Seccion;
