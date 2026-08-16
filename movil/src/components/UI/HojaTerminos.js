/*
 * ============================================================
 * HOJA DE TÉRMINOS — el documento, para leerlo
 * ============================================================
 * Lo que en la web es `ModalTerminos` + `TextoTerminos`. Se abre desde el
 * enlace del registro y NO navega a otro lado: quien está a mitad del
 * formulario no puede perder lo escrito por ir a leer qué está aceptando.
 *
 * ── La tabla de datos ──
 *
 * En la web es una tabla de cuatro columnas —qué dato, para qué, quién lo ve,
 * cuánto se guarda— y es el corazón del aviso. Cuatro columnas en un teléfono
 * son cuatro columnas de dos palabras cada una, ilegibles; y ponerla con
 * desplazamiento horizontal esconde justo las dos últimas, que son las que
 * importan ("quién más lo ve" y "cuánto lo guardan").
 *
 * Así que cada fila se vuelve una ficha con sus cuatro datos etiquetados, uno
 * debajo del otro. Ocupa más alto y se lee entera, que es de lo que se trata.
 * ============================================================
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../../theme/colores';
import { ALTURA_ESTADO } from '../../theme/pantalla';
import { Equis } from './Iconos';
import { useBotonAtras } from '../../hooks/useBotonAtras';
import { FECHA_TERMINOS, SECCIONES, TABLA_DATOS, VERSION_TERMINOS } from '../../utils/terminos';

const Bloque = ({ bloque }) => {
  switch (bloque.tipo) {
    case 'destacado':
      return (
        <View style={estilos.destacado}>
          <Text style={estilos.destacadoTexto}>{bloque.texto}</Text>
        </View>
      );

    case 'parrafo':
      return <Text style={estilos.parrafo}>{bloque.texto}</Text>;

    case 'lista':
      return (
        <View style={estilos.lista}>
          {bloque.puntos.map((punto, i) => (
            <View key={i} style={estilos.punto}>
              <View style={estilos.vinneta} />
              <Text style={estilos.puntoTexto}>{punto}</Text>
            </View>
          ))}
        </View>
      );

    case 'nota':
      return (
        <View style={estilos.nota}>
          <Text style={estilos.notaTexto}>{bloque.texto}</Text>
        </View>
      );

    case 'tabla':
      return (
        <View style={estilos.fichas}>
          {TABLA_DATOS.map((fila) => (
            <View key={fila.dato} style={estilos.ficha}>
              <Text style={estilos.fichaTitulo}>{fila.dato}</Text>
              <Dato etiqueta="Para qué" valor={fila.para} />
              <Dato etiqueta="Quién lo ve" valor={fila.quien} />
              <Dato etiqueta="Cuánto se guarda" valor={fila.cuanto} />
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
};

const Dato = ({ etiqueta, valor }) => (
  <View style={estilos.dato}>
    <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
    <Text style={estilos.datoValor}>{valor}</Text>
  </View>
);

const HojaTerminos = ({ alCerrar }) => {
  useBotonAtras(alCerrar);

  return (
    <View style={estilos.capa}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <Text style={estilos.tituloBarra}>Términos y privacidad</Text>
        <Pressable
          onPress={alCerrar}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cerrar los términos"
          style={({ pressed }) => [estilos.cerrar, pressed && estilos.cerrarPresionado]}
        >
          <Equis size={16} color={COLORES.textoSuave} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={estilos.cuerpo} showsVerticalScrollIndicator={false}>
        {SECCIONES.map((seccion) => (
          <View key={seccion.id} style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>{seccion.titulo}</Text>
            {seccion.bloques.map((bloque, i) => (
              <Bloque key={i} bloque={bloque} />
            ))}
          </View>
        ))}

        <Text style={estilos.pie}>
          Versión {VERSION_TERMINOS} · {FECHA_TERMINOS}
        </Text>
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORES.fondo,
    zIndex: 20,
    elevation: 20,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
  },
  tituloBarra: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  cerrar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cerrarPresionado: {
    backgroundColor: COLORES.marcaSuave,
  },
  cuerpo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  seccion: {
    marginBottom: 26,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  destacado: {
    backgroundColor: COLORES.marcaSuave,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORES.marca,
  },
  destacadoTexto: {
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORES.tituloVentaja,
    fontWeight: '500',
  },
  parrafo: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORES.textoVentaja,
    marginBottom: 10,
  },
  lista: {
    gap: 9,
    marginBottom: 10,
  },
  punto: {
    flexDirection: 'row',
    gap: 9,
  },
  vinneta: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORES.marca,
    // Alineada con la primera línea del texto, no con el centro del párrafo.
    marginTop: 8,
  },
  puntoTexto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: COLORES.textoVentaja,
  },
  nota: {
    backgroundColor: '#FAFAF9',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  notaTexto: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORES.textoSuave,
  },
  fichas: {
    gap: 10,
    marginBottom: 10,
  },
  ficha: {
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 12,
    padding: 13,
    gap: 8,
  },
  fichaTitulo: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  dato: {
    gap: 1,
  },
  datoEtiqueta: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.subtitulo,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  datoValor: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORES.textoVentaja,
  },
  pie: {
    fontSize: 12.5,
    color: COLORES.textoTenue,
    textAlign: 'center',
    marginTop: 6,
  },
});

export default HojaTerminos;
