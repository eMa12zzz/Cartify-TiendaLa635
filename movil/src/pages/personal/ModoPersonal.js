/*
 * ============================================================
 * EL MODO PERSONAL — la app de quien trabaja en la tienda (ModoPersonal.js)
 * ============================================================
 * Lo que ve quien entró por "¿Trabajas en la tienda?". Depende de su cuenta:
 *
 *   - El ADMINISTRADOR tiene dos secciones: Tiqui del panel (le pregunta cómo
 *     va el negocio y le pide cambios) y el Reparto (lo que antes era "Estoy
 *     trabajando" en la web). Cambia entre las dos arriba.
 *   - El EMPLEADO ve solo el Reparto.
 *
 * Las dos secciones se quedan montadas aunque no se vean: cambiar a Reparto no
 * borra la charla con Tiqui, y cambiar a Tiqui no corta la ubicación que se
 * está compartiendo con un cliente (el reparto vive aquí arriba, en
 * useRepartoPersonal, y no dentro de su pantalla).
 *
 * La tienda no está: para comprar se sale del modo personal.
 * ============================================================
 */

import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bike, LogOut, Sparkles } from 'lucide-react-native';
import { useColores, useEstilos } from '../../context/ModoContext';
import { useTema } from '../../context/TemaContext';
import { usePersonal } from '../../context/PersonalContext';
import { useRepartoPersonal } from '../../hooks/useRepartoPersonal';
import { ALTURA_ESTADO } from '../../theme/pantalla';
import TiquiAdmin from './TiquiAdmin';
import Reparto from './Reparto';

const SECCIONES = [
  { clave: 'tiqui', nombre: 'Tiqui', Icono: Sparkles },
  { clave: 'reparto', nombre: 'Reparto', Icono: Bike },
];

const ModoPersonal = () => {
  const estilos = useEstilos(crearEstilos);
  const COLORES = useColores();
  const { colores } = useTema();
  const { sesion, esAdmin, salir } = usePersonal();
  const reparto = useRepartoPersonal();
  // El administrador abre con Tiqui; el empleado solo tiene el Reparto.
  const [seccion, setSeccion] = useState(esAdmin ? 'tiqui' : 'reparto');
  const actual = esAdmin ? seccion : 'reparto';

  const pedirSalir = () => {
    Alert.alert(
      'Salir',
      reparto.enViaje.length
        ? 'Está compartiendo su ubicación con un cliente: al salir se deja de compartir. La app vuelve a ser la tienda.'
        : 'La app vuelve a ser la tienda. Para volver tendrá que entrar de nuevo con su cuenta y el código del correo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            // Nadie se queda viendo el punto de un repartidor que ya se fue.
            reparto.enViaje.forEach((id) => reparto.quitarDelViaje(id));
            salir();
          },
        },
      ]
    );
  };

  return (
    <View style={estilos.pantalla}>
      <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
        <View style={estilos.fila}>
          <View style={estilos.flexible}>
            <Text style={estilos.titulo} accessibilityRole="header">
              {sesion?.nombre ? `Hola, ${sesion.nombre}` : 'Personal de la tienda'}
            </Text>
            <Text style={estilos.subtitulo}>{esAdmin ? 'Administración' : 'Equipo de la tienda'}</Text>
          </View>
          <TouchableOpacity
            onPress={pedirSalir}
            accessibilityRole="button"
            accessibilityLabel="Salir del modo personal"
            hitSlop={8}
            style={estilos.accion}
          >
            <LogOut size={21} color={COLORES.textoSuave} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {esAdmin && (
          <View style={estilos.selector} accessibilityRole="tablist">
            {SECCIONES.map(({ clave, nombre, Icono }) => {
              const activa = actual === clave;
              return (
                <Pressable
                  key={clave}
                  onPress={() => setSeccion(clave)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activa }}
                  style={[estilos.opcion, activa && { backgroundColor: colores.marca }]}
                >
                  <Icono size={17} color={activa ? '#FFFFFF' : COLORES.textoSuave} strokeWidth={2} />
                  <Text style={[estilos.opcionTexto, { color: activa ? '#FFFFFF' : COLORES.textoSuave }]}>
                    {nombre}
                    {clave === 'reparto' && reparto.pedidos.length ? ` (${reparto.pedidos.length})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {esAdmin && (
        <View style={actual === 'tiqui' ? estilos.flexible : estilos.oculta}>
          <TiquiAdmin />
        </View>
      )}
      <View style={actual === 'reparto' ? estilos.flexible : estilos.oculta}>
        <Reparto reparto={reparto} />
      </View>
    </View>
  );
};

const crearEstilos = (COLORES) => StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORES.fondo },
  flexible: { flex: 1 },
  // Montada pero sin ocupar lugar: conserva la charla y el viaje en curso.
  oculta: { display: 'none' },
  barra: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
    gap: 12,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  titulo: { fontSize: 21, fontWeight: '800', color: COLORES.tituloFuerte, letterSpacing: -0.4 },
  subtitulo: { fontSize: 13, color: COLORES.textoSuave, marginTop: 1 },
  accion: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  selector: {
    flexDirection: 'row',
    backgroundColor: COLORES.papelGris,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  opcion: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  opcionTexto: { fontSize: 14.5, fontWeight: '800' },
});

export default ModoPersonal;
