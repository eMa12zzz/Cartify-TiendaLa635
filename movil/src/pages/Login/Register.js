/*
 * ============================================================
 * REGISTRARSE — la versión móvil de Register.jsx
 * ============================================================
 * Los mismos campos y el mismo orden que la web, que no es casual: nombre y
 * usuario primero (lo fácil), después los datos que hay que ir a buscar (DUI,
 * teléfono, dirección) y al final el correo y la contraseña, que son las que
 * de verdad abren la cuenta.
 *
 * Dos cosas se hacen distinto que en la web, y por buenas razones:
 *
 *   1. El DUI y el teléfono se formatean solos mientras se escriben, con las
 *      máscaras del proyecto. En la web esos dos campos solo son obligatorios;
 *      en un teclado de celular, donde el guion está en otra pantalla del
 *      teclado, dejarlo a mano garantiza que la base termine con "12345678-9"
 *      y "123456789" conviviendo.
 *
 *   2. La foto de perfil todavía no abre la galería: eso pide
 *      `expo-image-picker`, que no está instalado. El recuadro está puesto,
 *      con su sitio y su medida, para que al conectarlo no se mueva nada.
 *
 * Enviar NO crea la cuenta: el backend guarda los datos 15 minutos y manda un
 * código de 6 caracteres al correo. Por eso de aquí se sale a Verificación y
 * no a la tienda.
 * ============================================================
 */

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BarraMarca from '../../components/UI/BarraMarca';
import Boton from '../../components/UI/Boton';
import CampoTexto from '../../components/UI/CampoTexto';
import Casilla from '../../components/UI/Casilla';
import { Camara, Candado, Numeral, Persona, Pin, Sobre, Telefono } from '../../components/UI/Iconos';
import { registrarCliente } from '../../api/authApi';
import { COLORES } from '../../theme/colores';
import { formatearDui, formatearTelefono, LARGO_DUI, LARGO_TELEFONO } from '../../utils/mascaras';
import {
  requerido,
  sinErrores,
  validarContrasena,
  validarCorreo,
  validarDui,
  validarFormulario,
  validarTelefono,
} from '../../utils/validaciones';

const VALORES_INICIALES = {
  fullName: '',
  userName: '',
  dui: '',
  phoneNumber: '',
  clientAddress: '',
  email: '',
  password: '',
  // Consentimiento: aceptar es obligatorio, recibir promociones NO (va apagado).
  aceptaTerminos: false,
  promociones: false,
};

const REGLAS = {
  fullName: (v) => requerido(v, 'El nombre es obligatorio'),
  userName: (v) => requerido(v, 'El nombre de usuario es obligatorio'),
  dui: validarDui,
  phoneNumber: validarTelefono,
  clientAddress: (v) => requerido(v, 'La dirección es obligatoria'),
  email: validarCorreo,
  password: validarContrasena,
  // El servidor vuelve a exigirlo; esto es el aviso amable antes de enviar.
  aceptaTerminos: (v) => (v ? null : 'Debes aceptar los términos para crear la cuenta'),
};

const Register = ({ irALogin, alPedirCodigo }) => {
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [avisoServidor, setAvisoServidor] = useState('');
  const [cargando, setCargando] = useState(false);

  /*
   * `formateador` es opcional: los campos normales guardan lo que se teclea y
   * el DUI y el teléfono pasan primero por su máscara.
   */
  const cambiar = (campo, formateador) => (texto) => {
    const valor = formateador ? formateador(texto) : texto;
    setValores((v) => ({ ...v, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: null }));
    if (avisoServidor) setAvisoServidor('');
  };

  // Casillas: guardan un booleano en vez de texto, pero limpian igual el error.
  const alternar = (campo) => (marcada) => {
    setValores((v) => ({ ...v, [campo]: marcada }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: null }));
    if (avisoServidor) setAvisoServidor('');
  };

  const enviar = async () => {
    const encontrados = validarFormulario(valores, REGLAS);
    setErrores(encontrados);
    if (!sinErrores(encontrados)) return;

    try {
      setCargando(true);
      setAvisoServidor('');

      await registrarCliente({
        ...valores,
        email: valores.email.trim(),
        aceptaTerminos: valores.aceptaTerminos,
        promociones: valores.promociones,
      });

      // La cuenta todavía no existe: nace cuando vuelva el código del correo.
      alPedirCodigo(valores.email.trim());
    } catch (err) {
      setAvisoServidor(err.message || 'No se pudo completar el registro');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={estilos.pantalla}>
      <BarraMarca centrado />

      <KeyboardAvoidingView
        style={estilos.flexible}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={estilos.cuerpo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={estilos.titulo}>Regístrate</Text>

          <CampoTexto
            etiqueta="Nombre Completo"
            icono={Persona}
            marcador="Juan Pérez"
            valor={valores.fullName}
            alCambiar={cambiar('fullName')}
            error={errores.fullName}
            autoCapitalize="words"
          />

          <CampoTexto
            etiqueta="Nombre de Usuario"
            icono={Persona}
            marcador="juanperez99"
            valor={valores.userName}
            alCambiar={cambiar('userName')}
            error={errores.userName}
            autoCapitalize="none"
          />

          <CampoTexto
            etiqueta="DUI"
            icono={Numeral}
            marcador="00000000-0"
            valor={valores.dui}
            alCambiar={cambiar('dui', formatearDui)}
            error={errores.dui}
            keyboardType="number-pad"
            maxLength={LARGO_DUI}
          />

          <CampoTexto
            etiqueta="Teléfono"
            icono={Telefono}
            marcador="7000-0000"
            valor={valores.phoneNumber}
            alCambiar={cambiar('phoneNumber', formatearTelefono)}
            error={errores.phoneNumber}
            keyboardType="phone-pad"
            maxLength={LARGO_TELEFONO}
          />

          <CampoTexto
            etiqueta="Dirección"
            icono={Pin}
            marcador="San Salvador, El Salvador"
            valor={valores.clientAddress}
            alCambiar={cambiar('clientAddress')}
            error={errores.clientAddress}
          />

          <CampoTexto
            etiqueta="Correo Electrónico"
            icono={Sobre}
            marcador="juan@ejemplo.com"
            valor={valores.email}
            alCambiar={cambiar('email')}
            error={errores.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <CampoTexto
            etiqueta="Contraseña"
            icono={Candado}
            marcador="********"
            valor={valores.password}
            alCambiar={cambiar('password')}
            error={errores.password}
            esContrasena
            autoCapitalize="none"
          />

          <Text style={estilos.etiquetaFoto}>Foto de Perfil (Opcional)</Text>
          <Pressable
            style={({ pressed }) => [estilos.zonaFoto, pressed && estilos.zonaFotoPresionada]}
            accessibilityRole="button"
            accessibilityLabel="Subir foto de perfil"
          >
            <Camara size={28} />
            <Text style={estilos.textoFoto}>Toque para elegir su foto</Text>
            <Text style={estilos.ayudaFoto}>JPG o PNG, hasta 8 MB</Text>
          </Pressable>

          <View style={estilos.consentimiento}>
            <Casilla
              marcada={valores.aceptaTerminos}
              alCambiar={alternar('aceptaTerminos')}
              etiqueta="Acepto los términos y el aviso de privacidad"
            />
            {errores.aceptaTerminos ? (
              <Text style={estilos.errorCasilla}>{errores.aceptaTerminos}</Text>
            ) : null}

            <Casilla
              marcada={valores.promociones}
              alCambiar={alternar('promociones')}
              etiqueta="Quiero recibir promociones y novedades (opcional)"
            />
          </View>

          {avisoServidor ? (
            <View style={estilos.aviso}>
              <Text style={estilos.avisoTexto}>{avisoServidor}</Text>
            </View>
          ) : null}

          <Boton texto="Continuar" alPresionar={enviar} cargando={cargando} estilo={estilos.boton} />

          <Text style={estilos.pie}>
            ¿Ya tienes una cuenta?{' '}
            <Text style={estilos.pieEnlace} onPress={irALogin}>
              Iniciar Sesión
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  flexible: {
    flex: 1,
  },
  cuerpo: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: 20,
  },
  etiquetaFoto: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORES.texto,
    marginBottom: 6,
  },
  zonaFoto: {
    borderWidth: 1.5,
    borderColor: COLORES.borde,
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  zonaFotoPresionada: {
    borderColor: COLORES.marca,
    backgroundColor: COLORES.marcaSuave,
  },
  textoFoto: {
    fontSize: 13.5,
    color: '#6B6B6B',
    fontWeight: '600',
  },
  ayudaFoto: {
    fontSize: 12,
    color: COLORES.marcador,
  },
  consentimiento: {
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  errorCasilla: {
    color: '#B4231F',
    fontSize: 12,
    marginTop: -6,
    marginLeft: 26,
  },
  aviso: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCD9DA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  avisoTexto: {
    color: '#B4231F',
    fontSize: 13,
    lineHeight: 19,
  },
  boton: {
    marginTop: 10,
  },
  pie: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
    color: COLORES.textoTenue,
  },
  pieEnlace: {
    color: COLORES.marca,
    fontWeight: '600',
  },
});

export default Register;
