/*
 * ============================================================
 * CONFIRMAR EDAD — el candado de los productos +18
 * ============================================================
 * Puerto de `frontend/src/components/Store/ModalConfirmarEdad.jsx`. Pide el
 * DUI, no la fecha de nacimiento: en El Salvador el DUI se emite a los 18,
 * así que uno bien formado ya afirma la mayoría de edad. Sigue siendo una
 * barrera BLANDA (no se puede comprobar que el documento sea suyo) — la
 * verificación de verdad es el DUI físico al momento de la entrega, y eso
 * se dice en la propia pantalla.
 *
 * Quien decide CUÁNDO se abre esto es EdadContext, no esta pantalla: aquí
 * solo se pinta y se valida. Montarla o no (en vez de un `if (!abierto)`
 * como en la web) es lo que ya hacen ModalProducto y ModalPromo en esta
 * app, y de paso regala la animación de apertura sin pedirla dos veces.
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import { useBotonAtras } from '../../hooks/useBotonAtras';
import Boton from '../UI/Boton';
import CampoTexto from '../UI/CampoTexto';
import { duiEsValido } from '../../utils/validaciones';
import { formatearDui, LARGO_DUI } from '../../utils/mascaras';
import { EDAD_MINIMA } from '../../utils/edad';

const ModalConfirmarEdad = ({ alCerrar, alConfirmar }) => {
  const { colores } = useTema();
  const [dui, setDui] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Misma entrada que ModalProducto: fondo que se aclara, panel que sube.
  const fondoOpacidad = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fondoOpacidad, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(panelY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fondoOpacidad, panelY]);

  useBotonAtras(alCerrar);

  const escribir = (valor) => {
    setDui(formatearDui(valor));
    if (error) setError('');
  };

  const enviar = async () => {
    const d = dui.replace(/\D/g, '');
    if (!d.length) { setError('Ingrese su número de DUI.'); return; }
    if (d.length < 9) { setError('El DUI lleva 9 dígitos (12345678-9).'); return; }
    if (!duiEsValido(dui)) { setError('Ese DUI no parece correcto, revise los números.'); return; }

    setEnviando(true);
    try {
      await alConfirmar(dui);
    } finally {
      // Si `alConfirmar` cierra el modal (lo normal), esto ya no alcanza a
      // pintarse; se deja igual por si algún día se queda abierto con error.
      setEnviando(false);
    }
  };

  return (
    <View style={estilos.capa}>
      <Animated.View style={[estilos.fondo, { opacity: fondoOpacidad }]}>
        <Pressable style={estilos.zonaCierre} onPress={alCerrar} accessibilityLabel="Cerrar" />

        <Animated.View style={[estilos.panel, { transform: [{ translateY: panelY }] }]}>
          <View style={estilos.encabezado}>
            <View style={estilos.asa} />
          </View>

          <View style={estilos.contenido}>
            <View style={[estilos.icono, { backgroundColor: colores.marcaSuave }]}>
              <ShieldAlert size={26} color={colores.marcaOscuro} />
            </View>

            <Text style={estilos.titulo}>Producto para mayores de {EDAD_MINIMA}</Text>
            <Text style={estilos.texto}>
              Ingrese su número de DUI para verlo. Al recibir el pedido se le pedirá el
              documento físico; sin él, este producto no se puede entregar.
            </Text>

            <CampoTexto
              etiqueta="DUI"
              valor={dui}
              alCambiar={escribir}
              marcador="00000000-0"
              error={error}
              keyboardType="number-pad"
              maxLength={LARGO_DUI}
            />

            <Boton
              texto={enviando ? 'Confirmando…' : 'Confirmar'}
              alPresionar={enviar}
              deshabilitado={enviando}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
            />

            <Text style={estilos.aviso}>
              Solo se usa para habilitar la compra de productos restringidos. No se comparte.
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const estilos = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  zonaCierre: {
    flex: 1,
  },
  panel: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  encabezado: {
    paddingTop: 10,
    alignItems: 'center',
  },
  asa: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORES.borde,
  },
  contenido: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 30,
  },
  icono: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    marginBottom: 8,
  },
  texto: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORES.textoSuave,
    marginBottom: 18,
  },
  aviso: {
    fontSize: 11.5,
    lineHeight: 16.5,
    color: COLORES.textoTenue,
    marginTop: 14,
  },
});

export default ModalConfirmarEdad;
