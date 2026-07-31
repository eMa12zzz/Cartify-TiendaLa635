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

import { createRef, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BarraMarca from '../components/UI/BarraMarca';
import Boton from '../components/UI/Boton';
import { COLORES } from '../theme/colores';
import { verificarCodigoCorreo } from '../api/authApi';

const LARGO = 6;

const Verification = ({ correo, alVerificar, alVolver }) => {
  const [codigo, setCodigo] = useState(Array(LARGO).fill(''));
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Una referencia por casilla, para poder saltar sola a la siguiente.
  const casillas = useRef(Array.from({ length: LARGO }, () => createRef())).current;

  /*
   * Ojo con la forma de actualizar: `setCodigo(anterior => ...)` y no
   * `setCodigo([...codigo])`.
   *
   * No es cosmético. Cuando los caracteres entran más rápido de lo que React
   * alcanza a redibujar —al pegar, con el autocompletado del teclado, o
   * simplemente escribiendo rápido— dos llamadas seguidas leen el MISMO
   * `codigo` viejo del closure, y la segunda pisa lo que escribió la primera.
   * El síntoma es un código al que le faltan caracteres y un "código
   * inválido" que no se entiende, porque en la pantalla se ve bien lo poco
   * que quedó.
   */
  const escribir = (indice, texto) => {
    setError('');

    // Al pegar el código completo desde el correo llegan seis caracteres de
    // golpe: se reparten en las casillas en vez de tomar solo el primero.
    if (texto.length > 1) {
      const pegado = texto.replace(/\s/g, '').slice(0, LARGO).split('');
      const nuevo = Array(LARGO).fill('');
      pegado.forEach((caracter, i) => { nuevo[i] = caracter; });
      setCodigo(nuevo);
      casillas[Math.min(pegado.length, LARGO - 1)].current?.focus();
      return;
    }

    setCodigo((anterior) => {
      const nuevo = [...anterior];
      nuevo[indice] = texto;
      return nuevo;
    });

    if (texto && indice < LARGO - 1) casillas[indice + 1].current?.focus();
  };

  /*
   * El retroceso en una casilla vacía va a la anterior y la borra. Sin esto,
   * corregir un caracter obliga a tocar la casilla exacta con el dedo.
   */
  const alBorrar = (indice) => {
    if (indice === 0) return;

    setCodigo((anterior) => {
      // Si la casilla tiene algo, el propio TextInput ya la borra.
      if (anterior[indice]) return anterior;
      const nuevo = [...anterior];
      nuevo[indice - 1] = '';
      return nuevo;
    });

    if (!codigo[indice]) casillas[indice - 1].current?.focus();
  };

  const verificar = async () => {
    const completo = codigo.join('');
    if (completo.length !== LARGO) {
      setError(`Ingrese el código de ${LARGO} caracteres`);
      return;
    }

    try {
      setCargando(true);
      setError('');
      await verificarCodigoCorreo(completo);
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

          <View style={estilos.casillas}>
            {codigo.map((caracter, indice) => (
              <TextInput
                key={indice}
                ref={casillas[indice]}
                style={[estilos.casilla, caracter && estilos.casillaLlena]}
                value={caracter}
                onChangeText={(texto) => escribir(indice, texto)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') alBorrar(indice);
                }}
                maxLength={LARGO}
                autoCapitalize="none"
                autoFocus={indice === 0}
                selectTextOnFocus
              />
            ))}
          </View>
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
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: COLORES.texto,
    borderWidth: 1.5,
    borderColor: COLORES.borde,
    borderRadius: 8,
    backgroundColor: COLORES.fondo,
  },
  casillaLlena: {
    borderColor: COLORES.marca,
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
