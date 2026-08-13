/*
 * ============================================================
 * ASISTENTE POR VOZ — el apartado, todavía sin el asistente
 * ============================================================
 * La pantalla existe; el asistente no. Está a propósito.
 *
 * El de la web (`components/Store/AsistenteVoz.jsx` + `hooks/useVoiceAssistant`)
 * se apoya entero en dos cosas que el navegador regala y un teléfono no:
 * `SpeechRecognition` para oír y `speechSynthesis` para contestar. En React
 * Native no existe ninguna de las dos. Traerlo pide reconocimiento de voz
 * nativo, permiso de micrófono declarado en `app.json` y una compilación propia
 * —Expo Go no alcanza—, y eso es un apartado entero, no un botón.
 *
 * Mientras tanto esto NO es un micrófono que no responde. Un botón grande que
 * se toca y no hace nada se lee como una app rota; se toca tres veces, se sale
 * y no se vuelve. Así que aquí no hay nada que tocar: hay un dibujo apagado y
 * una frase que dice qué va a ir en este lugar. Cuando el asistente exista,
 * este archivo se reemplaza por el de verdad y la barra de abajo no se entera.
 * ============================================================
 */

import { StyleSheet, Text, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import { COLORES } from '../theme/colores';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useTema } from '../context/TemaContext';

const Asistente = () => {
  const { colores } = useTema();

  return (
    <View style={estilos.pantalla}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <Text style={estilos.titulo}>Asistente por voz</Text>
      </View>

      <View style={estilos.cuerpo}>
        {/*
          El círculo con el micrófono es el mismo gesto de la web, en gris: el
          color de marca lo reservamos para lo que sí funciona, y encenderlo
          aquí prometería un botón.
        */}
        <View style={estilos.circulo}>
          <Mic size={44} color={COLORES.marcador} strokeWidth={1.6} />
        </View>

        <Text style={estilos.encabezado}>Todavía no está disponible</Text>
        <Text style={estilos.bajada}>
          Aquí va a poder pedir sus compras hablando: buscar un producto, echarlo
          al carrito y preguntar cuánto lleva, sin escribir nada.
        </Text>

        <View style={[estilos.aviso, { borderColor: colores.marcaSuave, backgroundColor: colores.marcaTenue }]}>
          <Text style={estilos.avisoTexto}>
            Mientras tanto, el buscador de la tienda hace la misma búsqueda.
          </Text>
        </View>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  barra: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.4,
  },
  cuerpo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    // Sube el bloque un poco por encima del centro exacto: centrado del todo,
    // con la barra de abajo ocupando su franja, se ve caído.
    paddingBottom: 40,
  },
  circulo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    marginBottom: 22,
  },
  encabezado: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    textAlign: 'center',
    marginBottom: 8,
  },
  bajada: {
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  aviso: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avisoTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORES.textoVentaja,
    textAlign: 'center',
  },
});

export default Asistente;
