/*
 * ============================================================
 * EL PANEL DEL NEGOCIO EN LA APP — PanelWeb.js
 * ============================================================
 * El administrador tiene en la app el MISMO panel de la web (inventario,
 * pedidos, clientes, personalización...), abierto en un navegador dentro de
 * la app. Rehacer cada pantalla del panel para el teléfono sería tener dos
 * paneles que mantener; este es el de siempre, que ya se acomoda a pantallas
 * chicas (con su menú de tres rayas).
 *
 * LA SESIÓN. El navegador de adentro no comparte la sesión de la app. Para no
 * pedir otra vez contraseña y código, la app pide un pase de un solo uso
 * (vence en un minuto) y abre el panel con él; el panel lo canjea y queda
 * dentro. Ver backend/src/utils/pasesPanel.js.
 *
 *   - Va en incógnito: la sesión del panel vive mientras está abierto y se
 *     borra con él. Quien sale del modo personal no deja el panel abierto en
 *     el teléfono.
 *   - Si la sesión del panel vence a medio trabajo (el panel manda a su login
 *     con ?volver=), la app pide otro pase y lo devuelve a donde iba.
 *   - Si alguien cierra la sesión desde el panel, se queda cerrada hasta que
 *     toque "Volver a abrir".
 *
 * El botón atrás de Android va hacia atrás DENTRO del panel mientras se pueda.
 * Los enlaces que no son del panel (WhatsApp, correo, mapas) se abren fuera.
 * ============================================================
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColores, useEstilos } from '../../context/ModoContext';
import { useTema } from '../../context/TemaContext';
import { usePersonal } from '../../context/PersonalContext';
import { personalApi } from '../../api/personalApi';
import { URL_WEB } from '../../api/api';
import { useBotonAtras } from '../../hooks/useBotonAtras';
import Mascota, { CargandoMascota } from '../../components/Tiqui/Mascota';
import { direccionConPase, esDelPanel, queHacerCon } from '../../utils/panelWeb';

/*
 * Si el panel se va a su login una y otra vez nada más abrirlo, algo anda mal
 * del lado del servidor: después de dos intentos seguidos se para y se avisa,
 * en vez de quedarse pidiendo pases para siempre.
 */
const MAXIMO_REINTENTOS = 2;
const VENTANA_REINTENTOS_MS = 30000;

const PanelWeb = forwardRef(({ activo }, ref) => {
  const estilos = useEstilos(crearEstilos);
  const COLORES = useColores();
  const { colores } = useTema();
  const { sesion, salir } = usePersonal();

  const vista = useRef(null);
  const [direccion, setDireccion] = useState(null);
  // 'pidiendo' el pase · 'cargando' la primera página · 'listo' · 'error' · 'cerrada'
  const [estado, setEstado] = useState('pidiendo');
  const [puedeVolver, setPuedeVolver] = useState(false);
  const reintentos = useRef([]);

  // Pide un pase y abre el panel con él (en `volver`, si la sesión venció).
  const abrir = useCallback(async (volver) => {
    const ahora = Date.now();
    reintentos.current = reintentos.current.filter((t) => ahora - t < VENTANA_REINTENTOS_MS).concat(ahora);
    if (reintentos.current.length > MAXIMO_REINTENTOS + 1) {
      setEstado('error');
      return;
    }
    setEstado('pidiendo');
    try {
      const { pase } = await personalApi.paseDelPanel(sesion?.token);
      setDireccion(direccionConPase(URL_WEB, pase, volver));
      setEstado('cargando');
    } catch (error) {
      // La sesión de la app ya no vale: igual que en Tiqui y el Reparto, se sale.
      if (error?.estado === 401) { salir(); return; }
      setEstado('error');
    }
  }, [sesion?.token, salir]);

  useEffect(() => { abrir(); }, [abrir]);

  useImperativeHandle(ref, () => ({
    recargar: () => (estado === 'listo' ? vista.current?.reload() : abrir()),
  }), [estado, abrir]);

  // Atrás de Android: hacia atrás dentro del panel, mientras se pueda.
  const atras = useCallback(() => vista.current?.goBack(), []);
  useBotonAtras(atras, activo && estado === 'listo' && puedeVolver);

  const alCambiar = useCallback((navegacion) => {
    setPuedeVolver(navegacion.canGoBack);
    const que = queHacerCon(navegacion.url, URL_WEB);
    if (!que) return;
    vista.current?.stopLoading();
    if (que.accion === 'vencio') abrir(que.volver);
    else setEstado('cerrada');
  }, [abrir]);

  const alIrA = useCallback((pedido) => {
    if (esDelPanel(pedido.url, URL_WEB)) return true;
    Linking.openURL(pedido.url).catch(() => null);
    return false;
  }, []);

  const pantallaDeAviso = (pose, titulo, texto, boton) => (
    <View style={estilos.aviso}>
      <Mascota pose={pose} alto={130} />
      <Text style={estilos.avisoTitulo}>{titulo}</Text>
      <Text style={estilos.avisoTexto}>{texto}</Text>
      <Pressable
        onPress={() => { reintentos.current = []; abrir(); }}
        accessibilityRole="button"
        style={({ pressed }) => [estilos.boton, { backgroundColor: colores.marca }, pressed && estilos.presionado]}
      >
        <Text style={estilos.botonTexto}>{boton}</Text>
      </Pressable>
    </View>
  );

  if (estado === 'error') {
    return pantallaDeAviso(
      'sin-conexion',
      'No pudimos abrir el panel',
      'Revise su conexión. Si el servidor estaba dormido, puede tardar medio minuto en despertar.',
      'Reintentar'
    );
  }
  if (estado === 'cerrada') {
    return pantallaDeAviso(
      'saludo',
      'Cerró la sesión del panel',
      'Sus secciones de Tiqui y Reparto siguen abiertas. Cuando quiera, vuelva a abrir el panel.',
      'Volver a abrir'
    );
  }

  return (
    <View style={estilos.pantalla}>
      {direccion && (
        <WebView
          ref={vista}
          source={{ uri: direccion }}
          incognito
          domStorageEnabled
          javaScriptEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={alIrA}
          onNavigationStateChange={alCambiar}
          onLoadEnd={() => setEstado((e) => (e === 'cargando' ? 'listo' : e))}
          onError={() => setEstado('error')}
          style={[estilos.web, { backgroundColor: COLORES.fondo }]}
        />
      )}
      {(estado === 'pidiendo' || estado === 'cargando') && (
        <View style={[StyleSheet.absoluteFill, estilos.cargando]}>
          <CargandoMascota texto="Abriendo el panel…" />
        </View>
      )}
    </View>
  );
});

PanelWeb.displayName = 'PanelWeb';

const crearEstilos = (COLORES) => StyleSheet.create({
  pantalla: { flex: 1 },
  web: { flex: 1 },
  cargando: { backgroundColor: COLORES.fondo, alignItems: 'center', justifyContent: 'center' },
  aviso: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  avisoTitulo: { fontSize: 19, fontWeight: '800', color: COLORES.tituloFuerte, textAlign: 'center', marginTop: 8 },
  avisoTexto: { fontSize: 14.5, lineHeight: 21, color: COLORES.textoSuave, textAlign: 'center' },
  boton: { marginTop: 10, paddingHorizontal: 26, minHeight: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  presionado: { opacity: 0.85 },
  botonTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

export default PanelWeb;
