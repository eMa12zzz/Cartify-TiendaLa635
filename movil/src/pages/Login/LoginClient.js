/*
 * ============================================================
 * INICIAR SESIÓN — la puerta, ya no el portón
 * ============================================================
 * La versión móvil de `frontend/src/pages/LoginClient.jsx`. Allá la pantalla
 * son dos mitades: a la izquierda quién es la tienda y por qué vale la pena
 * tener cuenta, a la derecha el formulario. En pantalla angosta la web ya
 * resuelve eso poniendo el formulario primero (`order: 1`) y el saludo abajo
 * — que es exactamente el orden que se usa aquí, porque un celular es esa
 * pantalla angosta todo el tiempo.
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
import BarraMarca from '../../components/UI/BarraMarca';
import Boton from '../../components/UI/Boton';
import CampoTexto from '../../components/UI/CampoTexto';
import Casilla from '../../components/UI/Casilla';
import { Bici, Candado, Corazon, Estrella, Flecha, Sobre } from '../../components/UI/Iconos';
import { loginClientDB } from '../../api/authApi';
import { useAuth } from '../../hooks/useAuth';
import { COLORES } from '../../theme/colores';
import { sinErrores, validarContrasena, validarCorreo, validarFormulario } from '../../utils/validaciones';

// Lo que se gana teniendo cuenta. Está en datos y no repetido en el JSX porque
// son tres bloques con la misma forma y así se agrega un cuarto sin copiar y pegar.
const VENTAJAS = [
  {
    Icono: Bici,
    titulo: 'Siga su pedido en el mapa.',
    detalle: 'Vea al repartidor acercarse y sepa cuándo salir a la puerta.',
  },
  {
    Icono: Estrella,
    titulo: 'Junte puntos con cada compra.',
    detalle: 'Se convierten en descuento la próxima vez.',
  },
  {
    Icono: Corazon,
    titulo: 'Guarde sus favoritos.',
    detalle: 'Lo de siempre, sin volver a buscarlo.',
  },
];

const LoginClient = ({ irARegistro, irATienda }) => {
  const { login } = useAuth();
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
                <Text style={estilos.enlace}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </View>

            {avisoServidor ? (
              <View style={estilos.aviso}>
                <Text style={estilos.avisoTexto}>{avisoServidor}</Text>
              </View>
            ) : null}

            <Boton texto="Iniciar sesión" alPresionar={enviar} cargando={cargando} />

            <Text style={estilos.pie}>
              ¿No tiene una cuenta?{' '}
              <Text style={estilos.pieEnlace} onPress={irARegistro}>
                Regístrese
              </Text>
            </Text>
          </View>

          {/* ── Y debajo, quiénes somos ── */}
          <View style={estilos.saludo}>
            <Text style={estilos.titular}>
              El súper de la esquina, <Text style={estilos.titularFuerte}>a un toque</Text>
            </Text>
            <Text style={estilos.bajada}>
              Con su cuenta guardamos su dirección, sus puntos y lo que suele llevar, para que pedir
              la próxima vez le tome menos que hacer la lista.
            </Text>

            <View style={estilos.ventajas}>
              {VENTAJAS.map(({ Icono, titulo, detalle }) => (
                <View key={titulo} style={estilos.ventaja}>
                  <View style={estilos.cuadroIcono}>
                    <Icono size={16} />
                  </View>
                  <Text style={estilos.textoVentaja}>
                    <Text style={estilos.tituloVentaja}>{titulo}</Text> {detalle}
                  </Text>
                </View>
              ))}
            </View>

            <View style={estilos.sinCuenta}>
              <Text style={estilos.sinCuentaTexto}>¿No tiene cuenta?</Text>
              <Pressable
                onPress={irARegistro}
                style={({ pressed }) => [estilos.botonRegistro, pressed && estilos.botonRegistroPresionado]}
                accessibilityRole="button"
              >
                <Text style={estilos.botonRegistroTexto}>Regístrese aquí</Text>
                <Flecha size={16} />
              </Pressable>
            </View>
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

  // ── Saludo ──
  saludo: {
    marginTop: 34,
    alignItems: 'center',
  },
  titular: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.8,
    color: COLORES.tituloFuerte,
    textAlign: 'center',
    marginBottom: 16,
  },
  titularFuerte: {
    color: COLORES.marca,
  },
  bajada: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORES.textoSuave,
    textAlign: 'center',
    marginBottom: 26,
  },
  ventajas: {
    gap: 12,
    marginBottom: 30,
    alignSelf: 'stretch',
  },
  ventaja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  cuadroIcono: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORES.marcaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoVentaja: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORES.textoVentaja,
  },
  tituloVentaja: {
    color: COLORES.tituloVentaja,
    fontWeight: '700',
  },
  sinCuenta: {
    alignItems: 'center',
    gap: 14,
  },
  sinCuentaTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.tituloVentaja,
  },
  botonRegistro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: COLORES.marca,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
    elevation: 4,
    shadowColor: COLORES.marca,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  botonRegistroPresionado: {
    backgroundColor: COLORES.marcaOscuro,
  },
  botonRegistroTexto: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});

export default LoginClient;
