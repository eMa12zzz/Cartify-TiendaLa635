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
// Los mismos iconos que la web (lucide): correo `Mail`, contraseña `Lock`.
import { Lock, Mail } from 'lucide-react-native';
import { loginClientDB } from '../api/authApi';
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
          {/* ── El formulario, primero: es a lo que se vino ── */}
          <View style={estilos.tarjeta}>
            <Text style={estilos.titulo}>Inicie sesión para comprar</Text>
            <Text style={estilos.subtitulo}>Puede seguir viendo la tienda sin cuenta.</Text>

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
            />

            <CampoTexto
              etiqueta="Contraseña"
              icono={Lock}
              marcador="••••••••"
              valor={valores.password}
              alCambiar={cambiar('password')}
              error={errores.password}
              esContrasena
              autoCapitalize="none"
              autoComplete="password"
            />

            <View style={estilos.fila}>
              <Casilla marcada={recordarme} alCambiar={setRecordarme} etiqueta="Recordarme 30 días" />
              {/* Pendiente: la pantalla de recuperar contraseña todavía no existe en móvil. */}
              <Pressable hitSlop={8}>
                <Text style={[estilos.enlace, { color: colores.marca }]}>¿Olvidaste tu contraseña?</Text>
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
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
            />

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
          </View>
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
    padding: 20,
    paddingBottom: 48,
  },

  // ── Tarjeta del formulario ──
  tarjeta: {
    backgroundColor: COLORES.fondo,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 20,
    padding: 22,
    // La sombra suave de la web. En Android la da `elevation`; en iOS, las
    // tres propiedades de shadow.
    elevation: 3,
    shadowColor: '#3C2814',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 13.5,
    color: COLORES.subtitulo,
    textAlign: 'center',
    marginBottom: 24,
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
  pie: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORES.textoTenue,
    marginTop: 20,
  },
  pieEnlace: {
    color: COLORES.marca,
    fontWeight: '600',
  },
});

export default LoginClient;
