/*
 * ============================================================
 * CAMPO DE TEXTO — el input de la tienda, en nativo
 * ============================================================
 * En la web cada pantalla vuelve a declarar su `Label`, su `InputWrapper`, su
 * `IconWrapper` y su `Input` con styled-components. Son casi idénticos entre
 * LoginClient y Register, así que aquí se escriben una sola vez.
 *
 * Mantiene lo que importa del original: la etiqueta arriba, el icono metido
 * dentro del campo a la izquierda, el borde que se pone café al enfocar y rojo
 * al fallar, y el error en chiquito debajo.
 * ============================================================
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORES } from '../../theme/colores';
import { Ojo } from './Iconos';

const CampoTexto = ({
  etiqueta,
  icono: Icono,
  error,
  valor,
  alCambiar,
  marcador,
  esContrasena = false,
  ...props
}) => {
  const [enfocado, setEnfocado] = useState(false);
  const [verTexto, setVerTexto] = useState(false);

  // El rojo gana sobre el café: si el campo está mal, eso es lo que hay que ver.
  const colorBorde = error ? COLORES.error : enfocado ? COLORES.marca : COLORES.borde;

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>

      <View style={estilos.envoltorio}>
        {Icono && (
          <View style={estilos.icono} pointerEvents="none">
            <Icono size={18} />
          </View>
        )}

        <TextInput
          style={[
            estilos.campo,
            { borderColor: colorBorde },
            enfocado && !error && estilos.campoEnfocado,
            esContrasena && estilos.campoConOjo,
          ]}
          value={valor}
          onChangeText={alCambiar}
          placeholder={marcador}
          placeholderTextColor={COLORES.marcador}
          secureTextEntry={esContrasena && !verTexto}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          {...props}
        />

        {/*
         * El ojo para ver la contraseña. En un teclado de celular, escribir a
         * ciegas una clave con mayúsculas y símbolos es la razón número uno de
         * "no me deja entrar"; poder mirarla un segundo resuelve más que
         * cualquier mensaje de error.
         */}
        {esContrasena && (
          <Pressable
            onPress={() => setVerTexto((v) => !v)}
            style={estilos.ojo}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={verTexto ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ojo size={17} tachado={verTexto} />
          </Pressable>
        )}
      </View>

      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    marginBottom: 16,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORES.texto,
    marginBottom: 8,
  },
  envoltorio: {
    position: 'relative',
    justifyContent: 'center',
  },
  icono: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  campo: {
    width: '100%',
    paddingVertical: 12,
    paddingRight: 14,
    paddingLeft: 44,
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: 14,
    color: COLORES.texto,
    backgroundColor: COLORES.fondo,
  },
  // El halo café del `:focus` de la web, con la sombra que da Android.
  campoEnfocado: {
    elevation: 1,
    shadowColor: COLORES.marca,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  campoConOjo: {
    paddingRight: 44,
  },
  ojo: {
    position: 'absolute',
    right: 14,
    zIndex: 2,
  },
  error: {
    color: COLORES.error,
    fontSize: 12,
    marginTop: 5,
  },
});

export default CampoTexto;
