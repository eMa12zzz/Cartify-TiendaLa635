/*
 * ============================================================
 * MIS DATOS — nombre, usuario, correo, teléfono, fecha y DUI
 * ============================================================
 * El equivalente de `frontend/src/pages/cliente/DetallesCuenta.jsx`: los
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
 * ── La fecha de nacimiento y el DUI ──
 *
 * Los mismos dos campos que la web, con su misma regla: el DUI solo se habilita
 * cuando la fecha dice que ya es mayor de edad, porque en El Salvador el DUI se
 * emite a los 18. Los dos son opcionales y el endpoint
 * (`PATCH /client/:id/profile`) los acepta — vacíos, los borra.
 *
 * Guardar un DUI aquí además LEVANTA el candado de los productos +18 sin tener
 * que volver a escribirlo en el modal de la tienda: por eso se avisa a la
 * sesión con `actualizarUsuario` (ver EdadContext, que mira `user.dui`).
 *
 * ── Se valida antes de mandar ──
 *
 * El backend rechaza el perfil incompleto con un 400 y un "Faltan campos
 * obligatorios" que no dice cuál falta. Validando aquí, el error sale debajo
 * del campo que está mal — que es donde hay que ir a arreglarlo. Las reglas son
 * las mismas de utils/validaciones.js que ya usan el registro y el login.
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CargandoMascota, EsperaMascota } from '../../components/Tiqui/Mascota';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
// Los mismos iconos que el registro (y que la web): fecha `Calendar`, DUI `Hash`.
import { AtSign, Calendar, Camera, Hash, Mail, Phone, User } from 'lucide-react-native';
import { useEstilos } from '../../context/ModoContext';
import { useAireBarraFlotante } from '../../components/UI/BarraInferior';
import { useAuth } from '../../hooks/useAuth';
import { useTema } from '../../context/TemaContext';
import { useAviso } from '../../context/AvisoContext';
import { getCliente, actualizarPerfil, actualizarFotoPerfil } from '../../api/clienteApi';
import BarraCuenta from '../../components/Cuenta/BarraCuenta';
import CampoTexto from '../../components/UI/CampoTexto';
import Boton from '../../components/UI/Boton';
import {
  fechaISO,
  fechaVisible,
  formatearDui,
  formatearFecha,
  formatearTelefono,
  LARGO_DUI,
  LARGO_FECHA,
  LARGO_TELEFONO,
} from '../../utils/mascaras';
import { calcularEdad, EDAD_MINIMA, esMayorDeEdad } from '../../utils/edad';
import {
  requerido,
  validarCorreo,
  validarDui,
  validarTelefono,
  validarFormulario,
  sinErrores,
} from '../../utils/validaciones';

/*
 * La fecha es OPCIONAL aquí (en el registro sí es obligatoria): quien se
 * registró antes de que existiera el campo tiene la cuenta sin fecha, y
 * obligarlo a ponerla para cambiar su teléfono sería cobrarle un peaje.
 * Vacía pasa; escrita, tiene que ser una fecha de calendario real y de una
 * persona viva.
 */
const validarFechaOpcional = (valor) => {
  if (!String(valor || '').trim()) return null;
  const iso = fechaISO(valor);
  if (!iso) return 'Esa fecha no es válida';
  const edad = calcularEdad(iso);
  if (edad < 0 || edad > 120) return 'Revise la fecha';
  return null;
};

const REGLAS = {
  fullName: (v) => requerido(v, 'El nombre es requerido'),
  userName: (v) => requerido(v, 'El usuario es requerido'),
  email: validarCorreo,
  phoneNumber: validarTelefono,
  fechaNacimiento: validarFechaOpcional,
  dui: validarDui,
};

const MisDatos = ({ alVolver }) => {
  // Lo que hay que dejarle libre abajo a la píldora flotante.
  const aireAbajo = useAireBarraFlotante();
  const { user, actualizarUsuario } = useAuth();
  const { colores } = useTema();
  const estilos = useEstilos(crearEstilos);
  const { avisar } = useAviso();

  // "Siguiente" en el teclado: nombre → usuario → correo. Ver CampoTexto.
  const campoUsuario = useRef(null);
  const campoCorreo = useRef(null);
  const [form, setForm] = useState({
    fullName: '',
    userName: '',
    email: '',
    phoneNumber: '',
    fechaNacimiento: '',
    dui: '',
  });
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
          // La base guarda la fecha en ISO; el campo la enseña como DD/MM/AAAA.
          fechaNacimiento: fechaVisible(cliente?.fechaNacimiento),
          dui: formatearDui(cliente?.dui || ''),
        });
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

  // El DUI solo se habilita si la fecha dice que ya es mayor: en El Salvador
  // el DUI se emite a los 18, así que un menor cargándolo no tendría sentido.
  const mayorDeEdad = esMayorDeEdad(fechaISO(form.fechaNacimiento));

  const guardar = async () => {
    const fallos = validarFormulario(form, REGLAS);
    if (!sinErrores(fallos)) {
      setErrores(fallos);
      return;
    }

    /*
     * La fecha viaja en ISO, que es lo que guarda la base (y lo que ya manda
     * el <input type="date"> de la web). Si por lo que sea no es mayor, no se
     * manda un DUI que no debería tener — mismo criterio que DetallesCuenta.
     */
    const dui = mayorDeEdad ? form.dui.trim() : '';
    const datos = {
      ...form,
      fechaNacimiento: fechaISO(form.fechaNacimiento) || '',
      dui,
    };

    setGuardando(true);
    try {
      await actualizarPerfil(user.id, datos);
      /*
       * Que la sesión se entere del DUI: es lo que mira el candado de los +18
       * (ver EdadContext). Sin esto habría que volver a escribirlo en el modal
       * de la tienda aunque acabe de guardarlo aquí.
       */
      actualizarUsuario({ dui });
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
          <CargandoMascota texto="Cargando tu perfil…" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[estilos.cuerpo, { paddingBottom: aireAbajo }]}
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
                  <EsperaMascota alto={22} sobre="color" />
                ) : (
                  <Camera size={15} color="#FFFFFF" strokeWidth={2.2} />
                )}
              </View>
            </Pressable>
            {/* Sin DUI no se pinta el renglón: es opcional, y una etiqueta
                vacía solo hace ruido (mismo criterio que la web). */}
            {!!form.dui && <Text style={estilos.dui}>DUI: {form.dui}</Text>}
          </View>

          <CampoTexto
            etiqueta="Nombre completo"
            icono={User}
            valor={form.fullName}
            alCambiar={(v) => escribir('fullName', v)}
            marcador="Su nombre"
            error={errores.fullName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            siguiente={campoUsuario}
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
            autoComplete="username"
            textContentType="username"
            ref={campoUsuario}
            siguiente={campoCorreo}
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
            autoComplete="email"
            textContentType="emailAddress"
            ref={campoCorreo}
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

          {/* Fecha de nacimiento: es la que habilita los productos +18. Campo
              de texto con máscara, el mismo del registro — un selector de
              calendario sería un paquete nuevo para escribir ocho dígitos. */}
          <CampoTexto
            etiqueta="Fecha de nacimiento"
            icono={Calendar}
            valor={form.fechaNacimiento}
            alCambiar={(v) => escribir('fechaNacimiento', formatearFecha(v))}
            marcador="DD/MM/AAAA"
            error={errores.fechaNacimiento}
            keyboardType="number-pad"
            maxLength={LARGO_FECHA}
          />
          <Text style={estilos.ayuda}>
            Con ella se habilitan los productos para mayores de {EDAD_MINIMA}. El documento se
            revisa igual al entregar el pedido.
          </Text>

          {/* DUI: opcional, y solo se puede escribir cuando la fecha ya dice
              que es mayor de edad. Igual que en la web. */}
          <CampoTexto
            etiqueta="DUI (opcional)"
            icono={Hash}
            valor={form.dui}
            alCambiar={(v) => escribir('dui', formatearDui(v))}
            marcador={mayorDeEdad ? '00000000-0' : `Se habilita al indicar ${EDAD_MINIMA} años o más`}
            error={errores.dui}
            keyboardType="number-pad"
            maxLength={LARGO_DUI}
            editable={mayorDeEdad}
          />

          <View style={estilos.boton}>
            <Boton
              texto="Guardar cambios"
              alPresionar={guardar}
              cargando={guardando}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
              estilo={estilos.botonRedondo}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const crearEstilos = (COLORES) => StyleSheet.create({
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
  // La explicación debajo de la fecha. Sube un poco porque el campo de arriba
  // ya trae su propio margen de 16.
  ayuda: {
    marginTop: -10,
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 17,
    color: COLORES.textoTenue,
  },
  boton: {
    marginTop: 10,
  },
  // Píldora completa, a juego con los campos de arriba y con el resto de
  // botones de la app (login, candado de edad) — el Boton base trae 8 de
  // esquina, pensado para otros usos.
  botonRedondo: {
    borderRadius: 28,
  },
});

export default MisDatos;
