/*
 * ============================================================
 * MIS DATOS — nombre, usuario, correo y teléfono
 * ============================================================
 * El equivalente de `frontend/src/pages/cliente/DetallesCuenta.jsx`: los cuatro
 * campos que el cliente puede cambiar de su propia cuenta.
 *
 * ── La foto se sube aparte, tocando el círculo ──
 *
 * Va por el mismo endpoint (`PATCH /client/:id/profile`), pero como una
 * petición propia con FormData en cuanto se elige: no espera al botón
 * "Guardar cambios" de abajo, que es para los campos de texto. Total, el
 * cliente ya vio la foto puesta en el círculo — parecería que se subió y en
 * realidad quedó esperando a que toque otro botón.
 *
 * ── El DUI se ve pero no se toca ──
 *
 * Igual que en la web: se muestra debajo del avatar cuando existe, y no hay
 * campo para editarlo. El endpoint (`PATCH /client/:id/profile`) tampoco lo
 * acepta — solo mira fullName, userName, email y phoneNumber. Un campo editable
 * que el servidor ignora en silencio es la peor clase de campo: se escribe, se
 * guarda, dice "Datos actualizados" y no cambió nada.
 *
 * ── Se valida antes de mandar ──
 *
 * El backend rechaza el perfil incompleto con un 400 y un "Faltan campos
 * obligatorios" que no dice cuál falta. Validando aquí, el error sale debajo
 * del campo que está mal — que es donde hay que ir a arreglarlo. Las reglas son
 * las mismas de utils/validaciones.js que ya usan el registro y el login.
 * ============================================================
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { AtSign, Camera, Mail, Phone, User } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useAuth } from '../../hooks/useAuth';
import { useTema } from '../../context/TemaContext';
import { useAviso } from '../../context/AvisoContext';
import { getCliente, actualizarPerfil, actualizarFotoPerfil } from '../../api/clienteApi';
import BarraCuenta from '../../components/Cuenta/BarraCuenta';
import CampoTexto from '../../components/UI/CampoTexto';
import Boton from '../../components/UI/Boton';
import { useAlturaBarraInferior } from '../../components/UI/BarraInferior';
import { formatearDui, formatearTelefono, LARGO_TELEFONO } from '../../utils/mascaras';
import { requerido, validarCorreo, validarTelefono, validarFormulario, sinErrores } from '../../utils/validaciones';

const REGLAS = {
  fullName: (v) => requerido(v, 'El nombre es requerido'),
  userName: (v) => requerido(v, 'El usuario es requerido'),
  email: validarCorreo,
  phoneNumber: validarTelefono,
};

const MisDatos = ({ alVolver }) => {
  const { user } = useAuth();
  const { colores } = useTema();
  const { avisar } = useAviso();
  // Sin esto el botón de guardar queda tapado detrás de la píldora flotante.
  const alturaBarra = useAlturaBarraInferior();

  const [form, setForm] = useState({ fullName: '', userName: '', email: '', phoneNumber: '' });
  const [dui, setDui] = useState('');
  const [foto, setFoto] = useState(null);
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        const cliente = await getCliente(user.id);
        if (!vivo) return;
        setForm({
          fullName: cliente?.fullName || '',
          userName: cliente?.userName || '',
          email: cliente?.email || '',
          // El teléfono llega crudo de la base y se muestra con guion, igual
          // que en la web: 7890-1234.
          phoneNumber: formatearTelefono(cliente?.phoneNumber || ''),
        });
        setDui(cliente?.dui || '');
        setFoto(cliente?.image || null);
      } catch (e) {
        if (vivo) avisar(e?.message || 'No se pudieron cargar sus datos', 'error');
      } finally {
        if (vivo) setCargando(false);
      }
    })();

    return () => {
      vivo = false;
    };
  }, [user?.id, avisar]);

  // Escribir en un campo le borra SU error, no todos: corregir el correo no
  // debería hacer desaparecer el aviso de que falta el teléfono.
  const escribir = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: null } : prev));
  };

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      avisar('Necesita darle permiso a la app para ver sus fotos', 'error');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (resultado.canceled) return;

    const elegida = resultado.assets[0];
    setSubiendoFoto(true);
    try {
      // React Native no acepta un Blob real en FormData: quiere este objeto
      // con uri/name/type, y de ahí arma la parte multipart él solo.
      const respuesta = await actualizarFotoPerfil(user.id, {
        uri: elegida.uri,
        name: elegida.fileName || 'foto.jpg',
        type: elegida.mimeType || 'image/jpeg',
      });
      setFoto(respuesta?.client?.image || elegida.uri);
      avisar('Foto de perfil actualizada');
    } catch (e) {
      avisar(e?.message || 'No se pudo subir la foto', 'error');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardar = async () => {
    const fallos = validarFormulario(form, REGLAS);
    if (!sinErrores(fallos)) {
      setErrores(fallos);
      return;
    }

    setGuardando(true);
    try {
      await actualizarPerfil(user.id, form);
      avisar('Sus datos quedaron guardados');
      alVolver?.();
    } catch (e) {
      avisar(e?.message || 'No se pudieron guardar sus datos', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // La inicial del avatar, la misma cuenta que hace la web.
  const inicial = (form.fullName || form.userName || 'C').substring(0, 1).toUpperCase();

  return (
    <View style={estilos.pantalla}>
      <BarraCuenta titulo="Mis datos" alVolver={alVolver} />

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.marca} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[estilos.cuerpo, { paddingBottom: estilos.cuerpo.paddingBottom + alturaBarra }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={estilos.cabecera}>
            <Pressable
              onPress={elegirFoto}
              disabled={subiendoFoto}
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
              style={estilos.avatarToque}
            >
              {foto ? (
                <Image source={{ uri: foto }} contentFit="cover" style={estilos.avatarFoto} />
              ) : (
                <View style={[estilos.avatar, { backgroundColor: colores.marca }]}>
                  <Text style={estilos.avatarTexto}>{inicial}</Text>
                </View>
              )}

              <View style={[estilos.botonCamara, { backgroundColor: colores.marca }]}>
                {subiendoFoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Camera size={15} color="#FFFFFF" strokeWidth={2.2} />
                )}
              </View>
            </Pressable>
            {/* Sin DUI no se pinta el renglón: es opcional, y una etiqueta
                vacía solo hace ruido (mismo criterio que la web). */}
            {!!dui && <Text style={estilos.dui}>DUI: {formatearDui(dui)}</Text>}
          </View>

          <CampoTexto
            etiqueta="Nombre completo"
            icono={User}
            valor={form.fullName}
            alCambiar={(v) => escribir('fullName', v)}
            marcador="Su nombre"
            error={errores.fullName}
            autoCapitalize="words"
          />

          <CampoTexto
            etiqueta="Nombre de usuario"
            icono={AtSign}
            valor={form.userName}
            alCambiar={(v) => escribir('userName', v)}
            marcador="Su usuario"
            error={errores.userName}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <CampoTexto
            etiqueta="Correo electrónico"
            icono={Mail}
            valor={form.email}
            alCambiar={(v) => escribir('email', v)}
            marcador="correo@ejemplo.com"
            error={errores.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* El guion lo pone la máscara y el campo topa en 8 dígitos, así el
              teléfono queda guardado igual venga de donde venga. */}
          <CampoTexto
            etiqueta="Teléfono"
            icono={Phone}
            valor={form.phoneNumber}
            alCambiar={(v) => escribir('phoneNumber', formatearTelefono(v))}
            marcador="7890-1234"
            error={errores.phoneNumber}
            keyboardType="number-pad"
            maxLength={LARGO_TELEFONO}
          />

          <View style={estilos.boton}>
            <Boton
              texto="Guardar cambios"
              alPresionar={guardar}
              cargando={guardando}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: {
    padding: 20,
    paddingBottom: 32,
  },
  cabecera: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  avatarToque: {
    width: 84,
    height: 84,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFoto: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarTexto: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  botonCamara: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORES.fondo,
  },
  dui: {
    fontSize: 12,
    color: COLORES.textoTenue,
  },
  boton: {
    marginTop: 10,
  },
});

export default MisDatos;
