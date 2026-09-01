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
 *      máscaras del proyecto: en un teclado de celular, donde el guion está en
 *      otra pantalla del teclado, dejarlo a mano garantiza que la base termine
 *      con "12345678-9" y "123456789" conviviendo. El DUI es OPCIONAL, igual
 *      que en la web; si se escribe, se valida el dígito verificador (ver
 *      utils/validaciones.js `validarDui`).
 *
 *   2. La foto de perfil todavía no abre la galería: eso pide
 *      `expo-image-picker`, que no está instalado. El recuadro está puesto,
 *      con su sitio y su medida, para que al conectarlo no se mueva nada.
 *
 * ── Ya no se pide la dirección ──
 *
 * La tenía, y no servía para nada. El backend dejó de leerla (ver el comentario
 * al inicio de `backend/src/controller/Clients/registerClient.js`): mandaba un
 * texto suelto a un campo que después no leía nadie, porque las direcciones de
 * entrega viven en su propio apartado y se administran desde "Mi cuenta". Aquí
 * seguía siendo obligatoria, así que la app obligaba a escribir una dirección
 * para tirarla.
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
import BarraMarca from '../components/UI/BarraMarca';
import Boton from '../components/UI/Boton';
import CampoTexto from '../components/UI/CampoTexto';
import Casilla from '../components/UI/Casilla';
import HojaTerminos from '../components/UI/HojaTerminos';
// Los mismos iconos que la web (lucide): nombre/usuario `User`, DUI `Hash`,
// teléfono `Phone`, correo `Mail`, contraseña `Lock`, foto `Camera`.
import { Camera, Hash, Lock, Mail, Phone, User } from 'lucide-react-native';
import { registrarCliente } from '../api/authApi';
import { useTema } from '../context/TemaContext';
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
  email: '',
  password: '',
};

const REGLAS = {
  fullName: (v) => requerido(v, 'El nombre es obligatorio'),
  userName: (v) => requerido(v, 'El nombre de usuario es obligatorio'),
  dui: validarDui,
  phoneNumber: validarTelefono,
  email: validarCorreo,
  password: validarContrasena,
};

const Register = ({ irALogin, alPedirCodigo }) => {
  // La paleta de la temporada: el botón, los enlaces y la zona de foto se
  // pintan con ella, como la tienda. Fuera de temporada es el café de siempre.
  const { colores } = useTema();
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [avisoServidor, setAvisoServidor] = useState('');
  const [cargando, setCargando] = useState(false);

  /*
   * El consentimiento va aparte de `valores` porque no son campos de texto y
   * no pasan por `validarFormulario`.
   *
   * Son DOS casillas separadas a propósito, igual que en la web: aceptar las
   * condiciones y querer publicidad son dos cosas distintas, y meterlas en una
   * sola es cobrarle a alguien el permiso de mandarle promociones a cambio de
   * poder tener cuenta.
   */
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [promociones, setPromociones] = useState(false);
  const [errorTerminos, setErrorTerminos] = useState('');
  const [verTerminos, setVerTerminos] = useState(false);

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

  const enviar = async () => {
    const encontrados = validarFormulario(valores, REGLAS);
    setErrores(encontrados);

    /*
     * Los términos se revisan junto con lo demás y no antes: así quien no
     * llenó nada ve TODO lo que le falta de una vez, en vez de que el
     * formulario le vaya sacando un problema por intento.
     */
    const faltaAceptar = !aceptaTerminos;
    setErrorTerminos(faltaAceptar ? 'Hay que aceptar los términos para crear la cuenta' : '');

    if (!sinErrores(encontrados) || faltaAceptar) return;

    try {
      setCargando(true);
      setAvisoServidor('');

      await registrarCliente({
        ...valores,
        email: valores.email.trim(),
        aceptaTerminos,
        promociones,
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
            icono={User}
            marcador="Juan Pérez"
            valor={valores.fullName}
            alCambiar={cambiar('fullName')}
            error={errores.fullName}
            autoCapitalize="words"
            redondo
          />

          <CampoTexto
            etiqueta="Nombre de Usuario"
            icono={User}
            marcador="juanperez99"
            valor={valores.userName}
            alCambiar={cambiar('userName')}
            error={errores.userName}
            autoCapitalize="none"
            redondo
          />

          <CampoTexto
            etiqueta="DUI (opcional)"
            icono={Hash}
            marcador="00000000-0"
            valor={valores.dui}
            alCambiar={cambiar('dui', formatearDui)}
            error={errores.dui}
            keyboardType="number-pad"
            maxLength={LARGO_DUI}
            redondo
          />

          <CampoTexto
            etiqueta="Teléfono"
            icono={Phone}
            marcador="7000-0000"
            valor={valores.phoneNumber}
            alCambiar={cambiar('phoneNumber', formatearTelefono)}
            error={errores.phoneNumber}
            keyboardType="phone-pad"
            maxLength={LARGO_TELEFONO}
            redondo
          />

          <CampoTexto
            etiqueta="Correo Electrónico"
            icono={Mail}
            marcador="juan@ejemplo.com"
            valor={valores.email}
            alCambiar={cambiar('email')}
            error={errores.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            redondo
          />

          <CampoTexto
            etiqueta="Contraseña"
            icono={Lock}
            marcador="********"
            valor={valores.password}
            alCambiar={cambiar('password')}
            error={errores.password}
            esContrasena
            autoCapitalize="none"
            redondo
          />

          <Text style={estilos.etiquetaFoto}>Foto de Perfil (Opcional)</Text>
          <Pressable
            style={({ pressed }) => [
              estilos.zonaFoto,
              pressed && { borderColor: colores.marca, backgroundColor: colores.marcaSuave },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Subir foto de perfil"
          >
            <Camera size={28} color={COLORES.iconoCampo} />
            <Text style={estilos.textoFoto}>Toque para elegir su foto</Text>
            <Text style={estilos.ayudaFoto}>JPG o PNG, hasta 8 MB</Text>
          </Pressable>

          {/*
            El consentimiento. La casilla y el enlace van en la MISMA fila
            porque una casilla que no dice qué se está aceptando no es un
            consentimiento: es un trámite. Tocar "los términos" abre el
            documento encima, sin salir del formulario — ir a otra pantalla
            haría perder todo lo escrito.
          */}
          <View style={estilos.consentimiento}>
            <View style={estilos.filaTerminos}>
              <Casilla
                marcada={aceptaTerminos}
                alCambiar={(v) => {
                  setAceptaTerminos(v);
                  if (v) setErrorTerminos('');
                }}
                etiqueta="He leído y acepto"
              />
              <Text style={[estilos.enlace, { color: colores.marca }]} onPress={() => setVerTerminos(true)}>
                los términos y el aviso de privacidad
              </Text>
            </View>

            {errorTerminos ? <Text style={estilos.errorTerminos}>{errorTerminos}</Text> : null}

            {/*
              Opcional de verdad: se puede tener cuenta sin marcarla, y se
              apaga después desde "Mi cuenta > Notificaciones". Los avisos de
              sus pedidos no dependen de esto, porque esos no son publicidad.
            */}
            <Casilla
              marcada={promociones}
              alCambiar={setPromociones}
              etiqueta="Quiero recibir ofertas y novedades por correo (opcional)"
            />
          </View>

          {avisoServidor ? (
            <View style={estilos.aviso}>
              <Text style={estilos.avisoTexto}>{avisoServidor}</Text>
            </View>
          ) : null}

          <Boton
            texto="Continuar"
            alPresionar={enviar}
            cargando={cargando}
            estilo={estilos.boton}
            color={colores.marca}
            colorPresionado={colores.marcaOscuro}
          />

          <Text style={estilos.pie}>
            ¿Ya tienes una cuenta?{' '}
            <Text style={[estilos.pieEnlace, { color: colores.marca }]} onPress={irALogin}>
              Iniciar Sesión
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Encima de todo el formulario, que sigue montado detrás con lo escrito. */}
      {verTerminos && <HojaTerminos alCerrar={() => setVerTerminos(false)} />}
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
    marginBottom: 16,
  },
  /*
   * La casilla y el enlace en la misma línea, con `flexWrap`: en un teléfono
   * angosto "los términos y el aviso de privacidad" no cabe al lado de "He
   * leído y acepto", y sin el wrap el enlace se cortaba a la mitad.
   */
  filaTerminos: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  enlace: {
    fontSize: 13,
    color: COLORES.marca,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorTerminos: {
    color: COLORES.error,
    fontSize: 12,
    marginTop: -4,
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
    borderRadius: 28,
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
