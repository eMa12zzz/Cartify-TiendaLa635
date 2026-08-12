/*
 * ============================================================
 * VERIFICACIÓN — el código que llega al correo
 * ============================================================
 * La versión móvil de `Verification.jsx`, recortada al único flujo que la app
 * tiene hoy: terminar un registro. La web usa esta misma pantalla para el 2FA
 * del personal y para recuperar contraseña, y decide cuál con una bandera en
 * localStorage; aquí no hay nada que decidir todavía.
 *
 * Sin esta pantalla el registro no sirve de nada: el backend NO crea la cuenta
 * al enviar el formulario, solo guarda los datos 15 minutos y manda un código
 * de 6 caracteres. La cuenta nace cuando ese código vuelve.
 * ============================================================
 */

import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BarraMarca from '../../components/UI/BarraMarca';
import Boton from '../../components/UI/Boton';
import { COLORES } from '../../theme/colores';
import { verificarCodigoCorreo } from '../../api/authApi';

const LARGO = 6;

/*
 * ── Por qué UN input y no seis ──
 *
 * Lo natural es poner seis campos de un caracter y mover el foco solo. Se
 * probó y se rompe: los caracteres entran más rápido de lo que React redibuja
 * y de lo que el foco alcanza a moverse, así que escribir "abc123" dejaba
 * "ab2". Pasa al pegar el código del correo, con el autocompletado del
 * teclado, y escribiendo rápido a secas — y el síntoma engaña, porque el
 * servidor contesta "código inválido" mientras en pantalla se ve bien lo poco
 * que quedó.
 *
 * La cura no es afinar la carrera sino no tenerla: un solo TextInput
 * invisible guarda el código entero, y las seis casillas son dibujo. El
 * teclado, el pegado y el retroceso funcionan como en cualquier campo normal
 * porque son un campo normal.
 */
const Verification = ({ correo, alVerificar, alVolver }) => {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const campo = useRef(null);

  const escribir = (texto) => {
    setCodigo(texto.replace(/\s/g, '').slice(0, LARGO));
    setError('');
  };

  const verificar = async () => {
    if (codigo.length !== LARGO) {
      setError(`Ingrese el código de ${LARGO} caracteres`);
      return;
    }

    try {
      setCargando(true);
      setError('');
      await verificarCodigoCorreo(codigo);
      alVerificar();
    } catch (err) {
      setError(err.message || 'El código no es válido o ya venció.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={estilos.pantalla}>
      <BarraMarca centrado />

      <View style={estilos.cuerpo}>
        <Pressable onPress={alVolver} hitSlop={12} style={estilos.volver}>
          <Text style={estilos.flechaVolver}>←</Text>
        </Pressable>

        <Text style={estilos.titulo}>Ingrese el código de verificación</Text>

        <View style={estilos.caja}>
          <Text style={estilos.info}>
            Le enviamos un código a{' '}
            <Text style={estilos.correo}>{correo || 'su correo'}</Text>
          </Text>

          {/* Tocar cualquier casilla abre el teclado sobre el campo de verdad. */}
          <Pressable style={estilos.casillas} onPress={() => campo.current?.focus()}>
            {Array.from({ length: LARGO }, (_, indice) => (
              <View
                key={indice}
                style={[
                  estilos.casilla,
                  codigo[indice] && estilos.casillaLlena,
                  // La casilla que sigue se marca, para saber dónde va uno.
                  indice === codigo.length && estilos.casillaActiva,
                ]}
              >
                <Text style={estilos.caracter}>{codigo[indice] || ''}</Text>
              </View>
            ))}

            <TextInput
              ref={campo}
              style={estilos.campoOculto}
              value={codigo}
              onChangeText={escribir}
              maxLength={LARGO}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              caretHidden
            />
          </Pressable>
        </View>

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <Boton texto="Verificar" alPresionar={verificar} cargando={cargando} />

        <Text style={estilos.ayuda}>
          El código vence a los 15 minutos. Si ya venció, vuelva a registrarse.
        </Text>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  cuerpo: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  volver: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  flechaVolver: {
    fontSize: 24,
    color: COLORES.texto,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: 16,
  },
  caja: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    padding: 18,
    marginBottom: 20,
  },
  info: {
    fontSize: 13,
    color: COLORES.textoTenue,
    lineHeight: 20,
    marginBottom: 14,
  },
  correo: {
    fontWeight: '700',
    color: '#333333',
  },
  casillas: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  casilla: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORES.borde,
    borderRadius: 8,
    backgroundColor: COLORES.fondo,
  },
  casillaLlena: {
    borderColor: COLORES.marca,
  },
  casillaActiva: {
    borderColor: COLORES.marca,
    backgroundColor: COLORES.marcaSuave,
  },
  caracter: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORES.texto,
  },
  /*
   * El campo de verdad: cubre la fila de casillas para que el toque caiga en
   * él, pero no se ve. No se usa `display: none` ni `width: 0` porque un campo
   * sin tamaño no siempre recibe el foco en Android.
   */
  campoOculto: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 54,
    opacity: 0,
    color: 'transparent',
  },
  error: {
    color: COLORES.error,
    fontSize: 13,
    marginBottom: 12,
  },
  ayuda: {
    fontSize: 12.5,
    color: COLORES.textoTenue,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 19,
  },
});

export default Verification;
