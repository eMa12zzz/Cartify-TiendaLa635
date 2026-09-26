/*
 * ============================================================
 * LA MARCA DE LA TIENDA — MarcaTienda.js
 * ============================================================
 * El nombre (o el logo) de la tienda, igual en toda la app.
 *
 * Antes cada pantalla escribía "Tienda" / "la 635" a mano, y "Tienda" salía
 * chica y gris arriba de "la 635" grande y negrita — como si fueran una
 * etiqueta y un nombre, cuando juntas son el nombre completo del negocio.
 *
 * La web ya lo corrigió (ver `frontend/src/components/Store/MarcaTienda.jsx`):
 * las dos líneas van con el MISMO peso y color, y salen de los ajustes de la
 * tienda en vez de estar escritas en el código, así que si el dueño cambia el
 * nombre o sube un logo en Personalización, se ve aquí también. Esto es lo
 * mismo, del lado del teléfono.
 *
 * No incluye su propio botón: quien la usa (BarraTienda, BarraMarca) ya
 * envuelve el ícono y la marca juntos en su propio Pressable cuando hace
 * falta tocarla.
 */

import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAjustesTienda } from '../../hooks/useAjustesTienda';
import { useColores } from '../../context/ModoContext';
import { FUENTE_MARCA } from '../../theme/tipografia';

const MarcaTienda = ({ tamano = 20, alto, color: colorPedido, centrado = false }) => {
  // Casi negro en claro, casi blanco en oscuro — el color del texto principal.
  const COLORES = useColores();
  const color = colorPedido || COLORES.tinta;
  const { ajustes } = useAjustesTienda();
  const [logoFallo, setLogoFallo] = useState(false);
  const altoLogo = alto || tamano * 2;

  // Si la imagen no carga —Cloudinary caído, el archivo borrado— se cae al
  // nombre escrito, igual que en la web.
  if (ajustes.logoUrl && !logoFallo) {
    return (
      <Image
        source={{ uri: ajustes.logoUrl }}
        style={{ height: altoLogo, width: altoLogo * 3.2 }}
        resizeMode="contain"
        onError={() => setLogoFallo(true)}
      />
    );
  }

  return (
    <View style={centrado && estilos.centrado}>
      <Text style={[estilos.linea, { fontSize: tamano, lineHeight: tamano * 1.12, color }, centrado && estilos.textoCentrado]}>
        {ajustes.nombreLinea1}
      </Text>
      {!!ajustes.nombreLinea2 && (
        <Text style={[estilos.linea, { fontSize: tamano, lineHeight: tamano * 1.12, color }, centrado && estilos.textoCentrado]}>
          {ajustes.nombreLinea2}
        </Text>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  // La misma letra y el mismo apretado que la web (MarcaTienda.jsx). Ver theme/tipografia.js.
  linea: {
    fontFamily: FUENTE_MARCA,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  centrado: {
    alignItems: 'center',
  },
  textoCentrado: {
    textAlign: 'center',
  },
});

export default MarcaTienda;
