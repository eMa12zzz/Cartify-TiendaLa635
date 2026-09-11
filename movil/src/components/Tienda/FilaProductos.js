/*
 * ============================================================
 * FILA DE PRODUCTOS
 * ============================================================
 * Una sección de la portada: su título, su bajada, y los productos
 * deslizándose de lado. El equivalente de `FilaProductos.jsx` en la web.
 *
 * El título y "Ver todos" llevan al MISMO sitio a propósito: son dos puertas a
 * lo mismo, y la gente toca el título tanto como el enlace.
 *
 * El total va en el enlace y no suelto ("Ver todos (24)"): saber que hay 24 es
 * lo que hace que valga la pena entrar. "Ver todos" a secas puede ser una
 * pantalla con los mismos cinco que ya se están viendo.
 * ============================================================
 */

import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import TarjetaProducto from './TarjetaProducto';

const FilaProductos = ({ seccion, alVerTodos, alVerDetalle, alAgregar }) => {
  const { colores } = useTema();
  const total = seccion.todos?.length || seccion.productos.length;
  // Solo se ofrece entrar si de verdad hay más de lo que ya se ve.
  const hayMas = total > seccion.productos.length;

  return (
    <View style={estilos.seccion}>
      <View style={estilos.encabezado}>
        <Pressable onPress={alVerTodos} style={estilos.titulos} accessibilityRole="button">
          <Text style={estilos.titulo}>{seccion.titulo}</Text>
          {!!seccion.subtitulo && <Text style={estilos.subtitulo}>{seccion.subtitulo}</Text>}
        </Pressable>

        {hayMas && (
          <Pressable
            onPress={alVerTodos}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Ver los ${total} productos de ${seccion.titulo}`}
            style={({ pressed }) => [estilos.verTodos, pressed && { opacity: 0.6 }]}
          >
            <Text style={[estilos.verTodosTexto, { color: colores.marca }]}>
              Ver todos ({total})
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={seccion.productos}
        keyExtractor={(p) => p.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.fila}
        renderItem={({ item, index }) => (
          <View style={estilos.celda}>
            <TarjetaProducto producto={item} alVerDetalle={alVerDetalle} alAgregar={alAgregar} indice={index} />
          </View>
        )}
      />
    </View>
  );
};

const estilos = StyleSheet.create({
  seccion: {
    marginTop: 26,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titulos: {
    flexShrink: 1,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.3,
  },
  subtitulo: {
    fontSize: 12.5,
    color: COLORES.subtitulo,
    marginTop: 2,
  },
  verTodos: {
    // Alineado con el título, no con el bloque entero: con la bajada debajo,
    // centrarlo lo dejaba flotando a media altura.
    paddingTop: 2,
  },
  verTodosTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  fila: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  celda: {
    // Ancho fijo: en una fila horizontal las tarjetas no tienen de dónde sacar
    // su medida y se encogerían al ancho de su texto.
    width: 160,
  },
});

export default FilaProductos;
