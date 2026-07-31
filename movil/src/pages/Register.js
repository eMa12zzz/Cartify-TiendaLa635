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
 * OJO: por ahora esto es solo la interfaz. El envío finge la espera; cuando
 * exista la capa de API móvil, ahí va el POST a /registerClient con el
 * FormData y el salto a la pantalla de verificación.
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
import BarraMarca from '../components/UI/BarraMarca';
import Boton from '../components/UI/Boton';
import CampoTexto from '../components/UI/CampoTexto';
import { Camara, Candado, Numeral, Persona, Pin, Sobre, Telefono } from '../components/UI/Iconos';
import { COLORES } from '../theme/colores';
import { formatearDui, formatearTelefono, LARGO_DUI, LARGO_TELEFONO } from '../utils/mascaras';
import {
  requerido,
  sinErrores,
  validarContrasena,
  validarCorreo,
  validarDui,
  validarFormulario,
  validarTelefono,
} from '../utils/validaciones';

const VALORES_INICIALES = {
  fullName: '',
  userName: '',
  dui: '',
  phoneNumber: '',
  clientAddress: '',
  email: '',
  password: '',
};

const REGLAS = {
  fullName: (v) => requerido(v, 'El nombre es obligatorio'),
  userName: (v) => requerido(v, 'El nombre de usuario es obligatorio'),
  dui: validarDui,
  phoneNumber: validarTelefono,
  clientAddress: (v) => requerido(v, 'La dirección es obligatoria'),
  email: validarCorreo,
  password: validarContrasena,
};

const Register = ({ irALogin }) => {
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  /*
   * `formateador` es opcional: los campos normales guardan lo que se teclea y
   * el DUI y el teléfono pasan primero por su máscara.
   */
  const cambiar = (campo, formateador) => (texto) => {
    const valor = formateador ? formateador(texto) : texto;
    setValores((v) => ({ ...v, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: null }));
  };

  const enviar = () => {
    const encontrados = validarFormulario(valores, REGLAS);
    setErrores(encontrados);
    if (!sinErrores(encontrados)) return;

    setCargando(true);
    // TODO: POST /registerClient con FormData + navegar a Verificación.
    setTimeout(() => setCargando(false), 900);
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
