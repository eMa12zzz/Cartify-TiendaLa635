/*
 * ============================================================
 * INICIAR SESIÓN — la puerta, ya no el portón
 * ============================================================
 * La versión móvil de `frontend/src/pages/LoginClient.jsx`.
 *
 * ── Aquí solo va el formulario ──
 *
 * En la web la pantalla son dos mitades: a la izquierda quién es la tienda y
 * por qué vale la pena tener cuenta —el titular, las tres ventajas y un botón
 * grande de registro— y a la derecha el formulario. Eso se llegó a portar
 * poniendo el argumento debajo, que es lo que la propia web hace en pantalla
 * angosta.
 *
 * Se quitó. En un teléfono ese bloque no acompaña al formulario: lo entierra.
 * Son tres pantallazos de desplazamiento vendiendo la cuenta a alguien que ya
 * está escribiendo su correo para entrar, y con dos caminos distintos para
 * registrarse a distinta altura de la misma pantalla. Queda el enlace del pie
 * de la tarjeta, que es donde uno lo busca.
 *
 * Quien llega aquí ya venía haciendo algo (pagar, ver Mi Cuenta, guardar un
 * favorito), así que la pantalla tiene que verse como parte de la misma tienda
 * y no como un peaje. De ahí la salida de arriba y el "puede seguir viendo la
 * tienda sin cuenta" bajo el título.
 *
 * ── El rediseño de agosto de 2026 ──
 *
 * Formulario sin tarjeta con borde: el título grande a la izquierda y los
 * campos en píldora hacen de contenedor, no hace falta dibujar uno encima.
 * Y se sumó Google de verdad (antes no existía en móvil, solo en la web).
 * ============================================================
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import BarraMarca from '../components/UI/BarraMarca';
import Boton from '../components/UI/Boton';
import CampoTexto from '../components/UI/CampoTexto';
import Casilla from '../components/UI/Casilla';
import { LogoGoogle } from '../components/UI/Iconos';
// Los mismos iconos que la web (lucide): correo `Mail`, contraseña `Lock`.
import { Lock, Mail } from 'lucide-react-native';
import { googleLoginDB, loginClientDB } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import { useTema } from '../context/TemaContext';
import { COLORES } from '../theme/colores';
import { sinErrores, validarContrasena, validarCorreo, validarFormulario } from '../utils/validaciones';

const LoginClient = ({ irARegistro, irATienda }) => {
  const { login } = useAuth();
  // La paleta de la temporada: el botón y los enlaces se pintan con ella, igual
  // que la tienda. Fuera de temporada es el café de la marca de siempre.
  const { colores } = useTema();
  const [valores, setValores] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [avisoServidor, setAvisoServidor] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);

  const cambiar = (campo) => (texto) => {
    setValores((v) => ({ ...v, [campo]: texto }));
    // El error se borra al corregir, no al reenviar: nadie quiere seguir viendo
    // "formato inválido" en rojo mientras arregla el correo.
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: null }));
    if (avisoServidor) setAvisoServidor('');
  };

  const enviar = async () => {
    const encontrados = validarFormulario(valores, {
      email: validarCorreo,
      password: validarContrasena,
    });
    setErrores(encontrados);
    if (!sinErrores(encontrados)) return;

    try {
      setCargando(true);
      setAvisoServidor('');

      const res = await loginClientDB({
        email: valores.email.trim(),
        password: valores.password,
      });

      /*
       * El tipo lo dice el servidor: por esta misma puerta entran clientes y
       * personal, y de eso depende qué se le muestra después.
       */
      login(res.token, res.userType || 'client', res.client);
    } catch (err) {
      /*
       * El error del servidor va dentro de la tarjeta y no en una alerta que
       * hay que cerrar: "la contraseña es incorrecta" se lee al lado del campo
       * que hay que corregir, con la contraseña todavía escrita.
       */
      setAvisoServidor(err.message || 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  /*
   * Entrar con Google. El selector de cuenta nativo entrega un idToken; se
   * manda al backend (misma ruta y misma verificación que la web) y, si
   * cuadra, se sigue el mismo camino que el login normal.
   *
   * El correo aquí lo da Google, no un campo del formulario propio, así que
   * un error se avisa en el mismo cartel rojo de siempre — no hay a qué
   * campo pegárselo.
   */
  const conGoogle = async () => {
    try {
      setAvisoServidor('');
      setCargandoGoogle(true);

      await GoogleSignin.hasPlayServices();
      const respuesta = await GoogleSignin.signIn();
      // Cerró el selector de cuenta sin elegir ninguna: no es un error, no
      // hay nada que avisar.
      if (respuesta.type === 'cancelled') return;

      const idToken = respuesta.data.idToken;
      if (!idToken) {
        setAvisoServidor('No se recibió la respuesta de Google');
        return;
      }

      const res = await googleLoginDB(idToken);
      login(res.token, res.userType || 'client', res.client);
    } catch (err) {
      /*
       * Esta pantalla es para ENTRAR, no para registrarse — igual que la web.
       * Si el correo de Google no tiene cuenta, el backend se niega a
       * crearla aquí (no hay dónde aceptar los términos ni dejar el
       * teléfono) y contesta con `requiereConsentimiento`. La web manda a
       * completar el registro con el token ya en mano; ese formulario
       * todavía no existe en móvil, así que por ahora se le avisa claro y se
       * le deja el camino de Registro de siempre.
       */
      if (err.requiereConsentimiento) {
        setAvisoServidor('No tiene una cuenta con ese correo de Google. Regístrese primero.');
        return;
      }
      setAvisoServidor(err.message || 'No se pudo iniciar sesión con Google');
    } finally {
      setCargandoGoogle(false);
    }
  };

  const otroCargando = cargando || cargandoGoogle;

  return (
    <View style={estilos.pantalla}>
      <BarraMarca
        alTocarMarca={irATienda}
        textoAccion="Seguir viendo la tienda"
        alPresionarAccion={irATienda}
      />

      <KeyboardAvoidingView
        style={estilos.flexible}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={estilos.cuerpo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={estilos.titulo}>Bienvenido de nuevo</Text>
          <Text style={estilos.subtitulo}>Inicie sesión para seguir con su compra.</Text>

          <CampoTexto
            icono={Mail}
            marcador="Correo electrónico"
            valor={valores.email}
            alCambiar={cambiar('email')}
            error={errores.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel="Correo electrónico"
            redondo
          />

          <CampoTexto
            icono={Lock}
            marcador="Contraseña"
            valor={valores.password}
            alCambiar={cambiar('password')}
            error={errores.password}
            esContrasena
            autoCapitalize="none"
            autoComplete="password"
            accessibilityLabel="Contraseña"
            redondo
          />

          <View style={estilos.fila}>
            <Casilla marcada={recordarme} alCambiar={setRecordarme} etiqueta="Recordarme 30 días" />
            {/* Pendiente: la pantalla de recuperar contraseña todavía no existe en móvil. */}
            <Pressable hitSlop={8}>
              <Text style={[estilos.enlace, { color: colores.marca }]}>¿Olvidó su contraseña?</Text>
            </Pressable>
          </View>

          {avisoServidor ? (
            <View style={estilos.aviso}>
              <Text style={estilos.avisoTexto}>{avisoServidor}</Text>
            </View>
          ) : null}

          <Boton
            texto="Iniciar sesión"
            alPresionar={enviar}
            cargando={cargando}
            deshabilitado={cargandoGoogle}
            color={colores.marca}
            colorPresionado={colores.marcaOscuro}
            estilo={estilos.botonRedondo}
          />

          <View style={estilos.divisor}>
            <View style={estilos.linea} />
            <Text style={estilos.divisorTexto}>O continúa con</Text>
            <View style={estilos.linea} />
          </View>

          <Pressable
            onPress={conGoogle}
            disabled={otroCargando}
            accessibilityRole="button"
            accessibilityLabel="Continuar con Google"
            style={({ pressed }) => [
              estilos.botonGoogle,
              otroCargando && estilos.botonGoogleInactivo,
              pressed && !otroCargando && estilos.botonGooglePresionado,
            ]}
          >
            {cargandoGoogle ? (
              <ActivityIndicator size="small" color={COLORES.textoTenue} />
            ) : (
              <>
                <LogoGoogle size={18} />
                <Text style={estilos.botonGoogleTexto}>Continuar con Google</Text>
              </>
            )}
          </Pressable>

          {/*
            La única puerta al registro que queda, y va aquí porque es donde
            se busca: al final del formulario, después de comprobar que no se
            tiene con qué entrar.
          */}
          <Text style={estilos.pie}>
            ¿No tiene una cuenta?{' '}
            <Text style={[estilos.pieEnlace, { color: colores.marca }]} onPress={irARegistro}>
              Regístrese
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
    padding: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },

  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: COLORES.subtitulo,
    marginBottom: 26,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  enlace: {
    fontSize: 13,
    color: COLORES.marca,
    fontWeight: '600',
  },
  aviso: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCD9DA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  avisoTexto: {
    color: '#B4231F',
    fontSize: 13,
    lineHeight: 19,
  },
  botonRedondo: {
    borderRadius: 28,
  },

  // ── Divisor "O continúa con" ──
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 22,
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: COLORES.linea,
  },
  divisorTexto: {
    fontSize: 12.5,
    color: COLORES.textoTenue,
  },

  // ── Botón de Google: outline, no relleno como el de iniciar sesión ──
  botonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    minHeight: 50,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.fondo,
  },
  botonGooglePresionado: {
    backgroundColor: '#F5F5F5',
  },
  botonGoogleInactivo: {
    opacity: 0.6,
  },
  botonGoogleTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORES.texto,
  },

  pie: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORES.textoTenue,
    marginTop: 22,
  },
  pieEnlace: {
    color: COLORES.marca,
    fontWeight: '600',
  },
});

export default LoginClient;
