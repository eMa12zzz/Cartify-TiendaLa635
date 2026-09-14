/*
 * ============================================================
 * AYUDA Y CONTACTO — la portada de "Mi cuenta > Ayuda"
 * ============================================================
 * Copia de `frontend/src/pages/cliente/CentroAyuda.jsx`: los canales REALES
 * de la tienda (por ahora, WhatsApp y la dirección) más las mismas preguntas
 * frecuentes — mismo texto que la web, para que la respuesta no cambie según
 * desde dónde se pregunte.
 *
 * Perfil.js dejó esta pantalla afuera al principio porque el único canal
 * real (el WhatsApp) salía de una variable de Vite que en Expo no existe.
 * Ahora sale de `EXPO_PUBLIC_WHATSAPP` (ver utils/tienda.js y .env.example),
 * la versión de Expo de lo mismo.
 *
 * La regla sigue siendo la de la web: solo se ofrece lo que existe. Sin
 * WhatsApp configurado, esa tarjeta no se pinta — un botón que no lleva a
 * nadie es peor que no tener botón.
 * ============================================================
 */

import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HelpCircle, MapPin, MessageCircle } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import { useAviso } from '../../context/AvisoContext';
import { DIRECCION_EN_UNA_LINEA, enlaceWhatsApp } from '../../utils/tienda';
import BarraCuenta from '../../components/Cuenta/BarraCuenta';

const SALUDO_WHATSAPP = 'Hola, vengo de la app y necesito ayuda con mi pedido.';

// Mismas tres preguntas que useCentroAyuda.js en la web, palabra por palabra.
const FAQS = [
  {
    q: '¿Cómo hago un pedido?',
    a: 'Explora la tienda, agrega productos al carrito y presiona comprar. También puede usar el asistente por voz para pedir hablando.',
  },
  {
    q: '¿Cómo funcionan los puntos de fidelidad?',
    a: 'Gana puntos con cada compra según lo que gaste. Los ve en la sección "Puntos de fidelidad" y vencen pasado un tiempo.',
  },
  {
    q: '¿Dónde veo mis pedidos?',
    a: 'En "Recibos" ve sus pedidos ya entregados; mientras están en curso, la burbuja de abajo dice en qué van.',
  },
];

const Ayuda = ({ alVolver }) => {
  const { colores } = useTema();
  const { avisar } = useAviso();

  const whatsapp = enlaceWhatsApp(SALUDO_WHATSAPP);

  const abrirWhatsApp = async () => {
    try {
      await Linking.openURL(whatsapp);
    } catch {
      avisar('No se pudo abrir WhatsApp', 'error');
    }
  };

  return (
    <View style={estilos.pantalla}>
      <BarraCuenta titulo="Ayuda y contacto" alVolver={alVolver} />

      <ScrollView contentContainerStyle={estilos.cuerpo}>
        {/* Sin WhatsApp configurado solo queda la dirección; sin ninguno de
            los dos, esta sección entera no se pinta. */}
        {(whatsapp || DIRECCION_EN_UNA_LINEA) && (
          <View style={estilos.canales}>
            {whatsapp && (
              <Pressable
                onPress={abrirWhatsApp}
                accessibilityRole="button"
                accessibilityLabel="Escribirnos por WhatsApp"
                style={({ pressed }) => [estilos.canal, pressed && { backgroundColor: colores.marcaTenue }]}
              >
                <View style={[estilos.cuadroIcono, { backgroundColor: colores.marcaSuave }]}>
                  <MessageCircle size={18} color={colores.marca} strokeWidth={2} />
                </View>
                <View style={estilos.canalTextos}>
                  <Text style={estilos.canalEtiqueta}>WhatsApp</Text>
                  <Text style={estilos.canalValor}>Escríbanos, le contestamos ahí</Text>
                </View>
              </Pressable>
            )}

            {!!DIRECCION_EN_UNA_LINEA && (
              <View style={estilos.canal}>
                <View style={[estilos.cuadroIcono, { backgroundColor: colores.marcaSuave }]}>
                  <MapPin size={18} color={colores.marca} strokeWidth={2} />
                </View>
                <View style={estilos.canalTextos}>
                  <Text style={estilos.canalEtiqueta}>Pasa a la tienda</Text>
                  <Text style={estilos.canalValor}>{DIRECCION_EN_UNA_LINEA}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={estilos.filaTituloFaq}>
          <HelpCircle size={17} color={colores.marca} strokeWidth={2} />
          <Text style={estilos.tituloFaq}>Preguntas frecuentes</Text>
        </View>

        <View style={estilos.faqs}>
          {FAQS.map((faq, i) => (
            <View key={i}>
              <Text style={estilos.faqPregunta}>{faq.q}</Text>
              <Text style={estilos.faqRespuesta}>{faq.a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  cuerpo: {
    padding: 16,
    paddingBottom: 30,
  },
  canales: {
    gap: 8,
    marginBottom: 24,
  },
  canal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  cuadroIcono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canalTextos: {
    flex: 1,
    gap: 1,
  },
  canalEtiqueta: {
    fontSize: 12,
    color: COLORES.textoTenue,
  },
  canalValor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORES.tituloVentaja,
  },
  filaTituloFaq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  tituloFaq: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  faqs: {
    gap: 16,
  },
  faqPregunta: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
    marginBottom: 3,
  },
  faqRespuesta: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORES.textoSuave,
  },
});

export default Ayuda;
