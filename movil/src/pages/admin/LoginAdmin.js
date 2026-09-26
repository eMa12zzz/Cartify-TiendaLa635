/*
 * ============================================================
 * ENTRADA DEL ADMINISTRADOR — LoginAdmin.js
 * ============================================================
 * Por aquí entra el dueño desde el teléfono para hablar con Tiqui del panel.
 * Es el MISMO inicio de sesión del panel web, con sus dos pasos: correo y
 * contraseña, y después el código que llega al correo. Sin el segundo paso,
 * quien adivine la contraseña podría mover pedidos y precios desde cualquier
 * teléfono.
 *
 * Solo el administrador: los empleados usan el panel en la web. Si entra un
 * empleado, se le dice y se cierra la sesión que se acaba de abrir.
 *
 * Al terminar no se navega a ningún lado: AdminContext guarda la sesión y
 * App.js cambia la app entera al modo administrador (solo Tiqui).
 * ============================================================
 */

import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyRound, Lock, Mail } from 'lucide-react-native';
import BarraMarca from '../../components/UI/BarraMarca';
import Boton from '../../components/UI/Boton';
import CampoTexto from '../../components/UI/CampoTexto';
import TiquiColgada from '../../components/Tiqui/TiquiColgada';
import { tiquiAdminApi } from '../../api/tiquiAdminApi';
import { useAdmin } from '../../context/AdminContext';
import { useTema } from '../../context/TemaContext';
import { useEstilos } from '../../context/ModoContext';
import { validarCorreo } from '../../utils/validaciones';

const LoginAdmin = ({ alVolver }) => {
  const estilos = useEstilos(crearEstilos);
  const { colores } = useTema();
  const { iniciar } = useAdmin();

  const [paso, setPaso] = useState('credenciales'); // 'credenciales' | 'codigo'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [correoEnmascarado, setCorreoEnmascarado] = useState('');
  const [twofaToken, setTwofaToken] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enContrasena, setEnContrasena] = useState(false);
  const campoContrasena = useRef(null);

  const entrar = async () => {
    if (validarCorreo(email)) { setError('Escriba un correo válido.'); return; }
    if (!password) { setError('Escriba su contraseña.'); return; }
    setError('');
    setCargando(true);
    try {
      const r = await tiquiAdminApi.entrar({ email: email.trim(), password });
      setCorreoEnmascarado(r?.email || '');
      setTwofaToken(r?.twofaToken || '');
      setPaso('codigo');
    } catch (e) {
      setError(e.message || 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  const verificar = async () => {
    if (!/^\d{6}$/.test(codigo.trim())) { setError('El código son los 6 números que le llegaron al correo.'); return; }
    setError('');
    setCargando(true);
    try {
      const r = await tiquiAdminApi.verificar({ code: codigo.trim(), twofaToken });
      if (r?.tipo !== 'admin') {
        // Un empleado: su lugar es el panel web. Se cierra lo que se abrió.
        tiquiAdminApi.salir();
        setError('En el teléfono, por ahora solo entra el administrador. El equipo usa el panel en la web.');
        setPaso('credenciales');
        setCodigo('');
        return;
      }
      iniciar({
        token: r.token,
        nombre: String(r.admin?.userName || '').trim().split(/\s+/)[0] || '',
        email: r.admin?.email || '',
      });
    } catch (e) {
      setError(e.message || 'No se pudo verificar el código.');
    } finally {
      setCargando(false);
    }
  };

  const cara = cargando ? 'feliz' : error ? 'piensa' : enContrasena ? 'tapada' : 'normal';

  return (
    <View style={estilos.pantalla}>
      <BarraMarca alTocarMarca={alVolver} textoAccion="Volver a la tienda" alPresionarAccion={alVolver} />

      <KeyboardAvoidingView style={estilos.flexible} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.cuerpo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={estilos.tiqui} pointerEvents="none">
            <TiquiColgada cara={cara} alto={170} largo={70} />
          </View>

          {paso === 'credenciales' ? (
            <>
              <Text style={estilos.titulo} accessibilityRole="header">Entrar como administrador</Text>
              <Text style={estilos.subtitulo}>
                Con la misma cuenta del panel. En el teléfono va directo a Tiqui: le pregunta cómo va la tienda y le pide cambios.
              </Text>

              <CampoTexto
                icono={Mail}
                marcador="Correo del panel"
                valor={email}
                alCambiar={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                siguiente={campoContrasena}
                accessibilityLabel="Correo del panel"
                redondo
              />
              <CampoTexto
                icono={Lock}
                marcador="Contraseña"
                valor={password}
                alCambiar={setPassword}
                esContrasena
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                ref={campoContrasena}
                onFocus={() => setEnContrasena(true)}
                onBlur={() => setEnContrasena(false)}
                alEnviar={entrar}
                accessibilityLabel="Contraseña"
                redondo
              />
            </>
          ) : (
            <>
              <Text style={estilos.titulo} accessibilityRole="header">Revise su correo</Text>
              <Text style={estilos.subtitulo}>
                Le mandamos un código de 6 números{correoEnmascarado ? ` a ${correoEnmascarado}` : ''}. Vale por 10 minutos.
              </Text>
              <CampoTexto
                icono={KeyRound}
                marcador="Código de 6 números"
                valor={codigo}
                alCambiar={(t) => setCodigo(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                alEnviar={verificar}
                accessibilityLabel="Código de 6 números"
                redondo
              />
            </>
          )}

          {error ? (
            <View style={estilos.aviso} accessibilityLiveRegion="polite">
              <Text style={estilos.avisoTexto}>{error}</Text>
            </View>
          ) : null}

          <Boton
            texto={paso === 'credenciales' ? 'Continuar' : 'Entrar'}
            alPresionar={paso === 'credenciales' ? entrar : verificar}
            cargando={cargando}
            color={colores.marca}
            colorPresionado={colores.marcaOscuro}
            estilo={estilos.botonRedondo}
          />

          {paso === 'codigo' && (
            <Text
              style={[estilos.pieEnlace, { color: colores.marcaTexto }]}
              onPress={() => { setPaso('credenciales'); setCodigo(''); setError(''); }}
              accessibilityRole="button"
            >
              Usar otra cuenta
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const crearEstilos = (COLORES) => StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORES.fondo },
  flexible: { flex: 1 },
  cuerpo: { padding: 24, paddingTop: 28, paddingBottom: 48 },
  tiqui: { alignItems: 'center', marginTop: -28, marginBottom: 10 },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORES.subtitulo,
    marginBottom: 24,
    textAlign: 'center',
  },
  aviso: {
    backgroundColor: COLORES.peligroFondo,
    borderWidth: 1,
    borderColor: COLORES.peligroBorde,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  avisoTexto: { color: COLORES.peligro, fontSize: 13, lineHeight: 19 },
  botonRedondo: { borderRadius: 28, marginTop: 6 },
  pieEnlace: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 20, paddingVertical: 6 },
});

export default LoginAdmin;
