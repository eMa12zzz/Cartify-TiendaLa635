/*
 * ============================================================
 * FAVORITOS — lo que el cliente marcó con el corazón
 * ============================================================
 * El equivalente de `frontend/src/pages/cliente/Favoritos.jsx`, con la misma
 * cuadrícula de dos columnas que el resto de la app.
 *
 * ── No pide nada al servidor, y es a propósito ──
 *
 * La web llama a `GET /client/:id/favorites`, que devuelve los productos
 * poblados. Aquí las dos mitades de esa respuesta YA están cargadas: el
 * catálogo entero vive en TiendaContext y la lista de ids marcados en
 * FavoritosContext. Cruzarlas es una línea, y trae dos cosas que la petición no:
 *
 *   - Los precios ya llevan su promoción aplicada, porque salen del mismo
 *     catálogo mapeado que la portada. Pedirlos aparte daría el precio de lista,
 *     y el mismo producto se vería más caro aquí que en la tienda.
 *   - Quitar un corazón vacía la tarjeta al instante, sin recargar nada: la
 *     lista se arma de los ids, y los ids acaban de cambiar.
 *
 * Lo que sí se pierde: un producto que se marcó y después la tienda dio de baja
 * no aparece, porque el catálogo no lo trae. Es lo correcto — se puede querer
 * mucho un producto que ya no se vende, pero enseñarlo con su botón de agregar
 * es ofrecer algo que no hay.
 * ============================================================
 */

import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import { useTienda } from '../../context/TiendaContext';
import { useFavoritos } from '../../context/FavoritosContext';
import BarraCuenta from '../../components/Cuenta/BarraCuenta';
import TarjetaProducto from '../../components/Tienda/TarjetaProducto';
import ModalProducto from '../../components/Tienda/ModalProducto';

const Favoritos = ({ alVolver }) => {
  const { colores } = useTema();
  const { productos, cargando, agregarAlCarrito } = useTienda();
  const { esFavorito } = useFavoritos();

  const [productoAbierto, setProductoAbierto] = useState(null);

  const marcados = useMemo(
    () => productos.filter((p) => esFavorito(p.id)),
    [productos, esFavorito]
  );

  return (
    <View style={estilos.pantalla}>
      <BarraCuenta titulo="Mis favoritos" alVolver={alVolver} />

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.marca} />
        </View>
      ) : marcados.length === 0 ? (
        <View style={estilos.centro}>
          <Heart size={38} color={COLORES.marcador} strokeWidth={1.5} />
          <Text style={estilos.vacioTitulo}>Todavía no tiene favoritos</Text>
          <Text style={estilos.vacioTexto}>
            Toque el corazón de un producto en la tienda y lo va a encontrar aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={marcados}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={estilos.fila}
          contentContainerStyle={estilos.lista}
          ListHeaderComponent={
            <Text style={estilos.conteo}>
              {marcados.length} {marcados.length === 1 ? 'producto guardado' : 'productos guardados'}
            </Text>
          }
          renderItem={({ item }) => (
            /*
             * El tope de ancho es lo que arregla la última fila impar: con
             * `flex: 1` a secas, un producto solo abajo se estira a lo ancho de
             * la pantalla. Mismo criterio que la portada.
             */
            <View style={estilos.celda}>
              <TarjetaProducto
                producto={item}
                alVerDetalle={setProductoAbierto}
                alAgregar={agregarAlCarrito}
              />
            </View>
          )}
        />
      )}

      {productoAbierto && (
        <ModalProducto
          producto={productoAbierto}
          alCerrar={() => setProductoAbierto(null)}
          alAgregar={agregarAlCarrito}
          conBarraFlotante
        />
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  vacioTitulo: {
    marginTop: 4,
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  vacioTexto: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  lista: {
    paddingVertical: 14,
  },
  conteo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontSize: 12.5,
    fontWeight: '500',
    color: COLORES.subtitulo,
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

export default Favoritos;
