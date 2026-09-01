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
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';

const CampoTexto = ({
  etiqueta,
  icono: Icono,
  error,
  valor,
  alCambiar,
  marcador,
  esContrasena = false,
  // Pill redondeada en vez de la esquina de 8 de siempre — la usa el login
  // rediseñado. Opcional para no mover el resto de formularios (Registro,
  // el DUI de ModalConfirmarEdad) que siguen con el campo cuadrado normal.
  redondo = false,
  ...props
}) => {
  const [enfocado, setEnfocado] = useState(false);
  const [verTexto, setVerTexto] = useState(false);

  // El borde de foco se pinta con el color de la temporada, igual que la
  // tienda: en Navidad se enfoca en verde, en Independencia en azul. Fuera de
  // temporada `colores.marca` es el café de siempre.
  const { colores } = useTema();

  // El rojo gana sobre la marca: si el campo está mal, eso es lo que hay que ver.
  const colorBorde = error ? COLORES.error : enfocado ? colores.marca : COLORES.borde;

  return (
    <View style={estilos.contenedor}>
      {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}

      <View style={estilos.envoltorio}>
        {Icono && (
          <View style={[estilos.icono, redondo && estilos.iconoRedondo]} pointerEvents="none">
            {/* El color se pasa aquí para que los iconos de lucide (que por
                defecto van negros) tomen el mismo gris que la web (#aaa). */}
            <Icono size={18} color={COLORES.iconoCampo} />
          </View>
        )}

        <TextInput
          style={[
            estilos.campo,
            redondo && estilos.campoRedondo,
            { borderColor: colorBorde },
            enfocado && !error && [estilos.campoEnfocado, { shadowColor: colores.marca }],
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
         *
         * Se usan `Eye`/`EyeOff` de lucide-react-native —los MISMOS iconos que
         * la web (`Eye`/`EyeOff` de lucide-react)— para que el ojo quede
         * idéntico. Cuando la contraseña está a la vista, el icono es el ojo
         * tachado (para ocultarla).
         */}
        {esContrasena && (
          <Pressable
            onPress={() => setVerTexto((v) => !v)}
            style={estilos.ojo}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={verTexto ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {verTexto ? <EyeOff size={17} color="#9CA3AF" /> : <Eye size={17} color="#9CA3AF" />}
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
  /*
   * ── Por qué estos dos llevan `elevation` ──
   *
   * En Android `elevation` decide qué se dibuja encima, y le GANA a `zIndex`.
   * El campo enfocado lleva `elevation: 1` (ver `campoEnfocado`, que es el halo
   * del :focus de la web), así que al empezar a escribir el input se ponía por
   * encima del icono; y como el input tiene fondo blanco opaco, se lo tragaba.
   * El icono desaparecía justo al tocarlo y volvía al salir del campo.
   *
   * `zIndex` solo no alcanza: hay que subirlos por encima del 1 del campo.
   * En iOS `elevation` se ignora y ordena el zIndex, así que no molesta.
   */
  icono: {
    position: 'absolute',
    left: 14,
    zIndex: 2,
    elevation: 2,
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
  campoRedondo: {
    borderRadius: 28,
    paddingVertical: 15,
    paddingLeft: 46,
  },
  iconoRedondo: {
    left: 18,
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
  // El ojo tenía el mismo problema y se notaba más: desaparecía justo al
  // escribir la contraseña, que es cuando se necesita.
  ojo: {
    position: 'absolute',
    right: 14,
    zIndex: 3,
    elevation: 3,
  },
  error: {
    color: COLORES.error,
    fontSize: 12,
    marginTop: 5,
  },
});

export default CampoTexto;
