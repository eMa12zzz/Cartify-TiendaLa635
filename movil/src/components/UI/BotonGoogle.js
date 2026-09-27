/*
 * ============================================================
 * CON GOOGLE — BotonGoogle.js
 * ============================================================
 * El botón de Google del inicio de sesión y del registro. Contorneado, no
 * relleno como el de la acción principal que va arriba: es la otra puerta,
 * no la primera. Vive aparte para que las dos pantallas no se desigualen;
 * antes estaba escrito solo dentro de LoginClient.
 *
 * Lo que dice lo pone cada pantalla, como el botón oficial de la web:
 * "Continuar con Google" al entrar, "Registrarse con Google" al crear la
 * cuenta.
 * ============================================================
 */

import { Pressable, StyleSheet, Text } from 'react-native';
import { EsperaMascota } from '../Tiqui/Mascota';
import { LogoGoogle } from './Iconos';
import { useEstilos } from '../../context/ModoContext';

const BotonGoogle = ({
  texto,
  alPresionar,
  cargando = false,
  textoCargando = 'Un momento…',
  // Otra cosa de la pantalla está trabajando (el botón principal): este
  // espera, para no mandar dos pedidos al servidor a la vez.
  deshabilitado = false,
}) => {
  const estilos = useEstilos(crearEstilos);
  const inactivo = cargando || deshabilitado;

  return (
    <Pressable
      onPress={alPresionar}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }) => [
        estilos.boton,
        inactivo && estilos.inactivo,
        pressed && !inactivo && estilos.presionado,
      ]}
    >
      {cargando ? (
        <>
          <EsperaMascota alto={22} />
          <Text style={estilos.texto}>{textoCargando}</Text>
        </>
      ) : (
        <>
          <LogoGoogle size={18} />
          <Text style={estilos.texto}>{texto}</Text>
        </>
      )}
    </Pressable>
  );
};

const crearEstilos = (COLORES) => StyleSheet.create({
  boton: {
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
  presionado: {
    backgroundColor: COLORES.papelGris,
  },
  inactivo: {
    opacity: 0.6,
  },
  texto: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORES.texto,
  },
});

export default BotonGoogle;
