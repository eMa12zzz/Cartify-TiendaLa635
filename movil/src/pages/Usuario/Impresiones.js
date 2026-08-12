import { useState, useEffect } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, Switch,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useAuth } from '../../hooks/useAuth';
import { printServiceService } from '../../api/Usuario/printServiceService';
import { orderService } from '../../api/Usuario/orderService';
import { calcularPrecioImpresion } from '../../utils/precioImpresion';
import { aviso } from '../../utils/aviso';

/*
 * Impresiones — pedir una impresión desde el teléfono.
 * Puerto de `frontend/src/pages/impresiones.jsx` (modo "archivo"). Se elige un
 * formato del catálogo real (/printService), se sube un archivo con el selector
 * del sistema (expo-document-picker), se ajustan las opciones (color, copias,
 * páginas, doble cara, papel), se ve el precio (misma fórmula del backend) y se
 * crea el pedido de impresión (multipart). El editor de hojas de la web no se
 * porta en este paso.
 */
const PAPELES = ['Normal', 'Fotográfico', 'Reciclado'];

export default function Impresiones({ navigation }) {
  const { user, esCliente } = useAuth();

  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [servicioId, setServicioId] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [color, setColor] = useState(false);
  const [copias, setCopias] = useState(1);
  const [paginas, setPaginas] = useState('1');
  const [dobleCara, setDobleCara] = useState(false);
  const [papel, setPapel] = useState('Normal');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    printServiceService.getServices()
      .then((lista) => setServicios(Array.isArray(lista) ? lista : []))
      .catch(() => setServicios([]))
      .finally(() => setCargando(false));
  }, []);

  const servicio = servicios.find((s) => s._id === servicioId) || null;
  const precio = calcularPrecioImpresion({
    servicio, paginas: Number(paginas) || 1, copias, color, dobleCara,
  });

  const elegirArchivo = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!r.canceled && r.assets?.[0]) setArchivo(r.assets[0]);
    } catch {
      aviso('No se pudo abrir el selector de archivos');
    }
  };

  const enviar = async () => {
    if (!servicioId) { aviso('Selecciona un formato de impresión.'); return; }
    if (!esCliente) { aviso('Inicia sesión como cliente para enviar tu impresión.'); navigation.navigate('login'); return; }
    if (!archivo) { aviso('Sube un archivo antes de continuar.'); return; }

    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('file', { uri: archivo.uri, name: archivo.name || 'documento', type: archivo.mimeType || 'application/octet-stream' });
      fd.append('clientId', user.id);
      fd.append('serviceId', servicioId);
      fd.append('color', String(color));
      fd.append('copies', String(copias));
      fd.append('pages', String(Number(paginas) || 1));
      fd.append('doubleSided', String(dobleCara));
      fd.append('paper', papel);

      const r = await orderService.createPrintOrder(fd);
      aviso(r?.emailedToPrinter ? '¡Enviado a la impresora!' : '¡Pedido de impresión creado!');
      setArchivo(null); setCopias(1); setColor(false); setDobleCara(false); setPapel('Normal'); setPaginas('1');
    } catch (e) {
      aviso(e?.message || 'No se pudo crear el pedido de impresión');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <TouchableOpacity onPress={() => navigation.navigate('tienda')} style={styles.headBtn}>
          <Text style={styles.headBtnText}>‹ Tienda</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Impresiones</Text>
        <View style={{ width: 70 }} />
      </View>

      {cargando ? (
        <View style={styles.centered}><ActivityIndicator color={c.primary} size="large" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          {/* 1. Formato */}
          <Text style={styles.step}>1. Elige el formato</Text>
          {servicios.length === 0 ? (
            <Text style={styles.vacio}>No hay formatos disponibles por ahora.</Text>
          ) : (
            <View style={styles.formatos}>
              {servicios.map((s) => {
                const on = s._id === servicioId;
                return (
                  <TouchableOpacity key={s._id} style={[styles.formato, on && styles.formatoOn]} onPress={() => setServicioId(s._id)}>
                    <Text style={[styles.formatoNombre, on && { color: c.primary }]}>{s.name}</Text>
                    <Text style={styles.formatoPrecio}>${Number(s.pricePerCopy).toFixed(2)}/hoja</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 2. Archivo */}
          <Text style={styles.step}>2. Sube tu archivo</Text>
          <TouchableOpacity style={styles.subidor} onPress={elegirArchivo}>
            <Text style={styles.subidorIcon}>📄</Text>
            <Text style={styles.subidorText} numberOfLines={1}>
              {archivo ? archivo.name : 'Toca para elegir un archivo (PDF, imagen…)'}
            </Text>
          </TouchableOpacity>

          {/* 3. Opciones */}
          <Text style={styles.step}>3. Opciones</Text>

          <View style={styles.fila}>
            <Text style={styles.label}>Páginas del documento</Text>
            <TextInput
              style={styles.numInput}
              value={paginas}
              onChangeText={(v) => setPaginas(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={c.textMuted}
            />
          </View>

          <View style={styles.fila}>
            <Text style={styles.label}>Copias</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => setCopias((n) => Math.max(1, n - 1))} style={styles.stepBtn}><Text style={styles.stepText}>−</Text></TouchableOpacity>
              <Text style={styles.stepQty}>{copias}</Text>
              <TouchableOpacity onPress={() => setCopias((n) => n + 1)} style={styles.stepBtn}><Text style={styles.stepText}>+</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.fila}>
            <Text style={styles.label}>Doble cara</Text>
            <Switch value={dobleCara} onValueChange={setDobleCara} trackColor={{ true: c.primary }} />
          </View>

          <View style={styles.fila}>
            <Text style={styles.label}>
              A color {servicio && !servicio.allowsColor ? '(no disponible en este formato)' : ''}
            </Text>
            <Switch
              value={color}
              onValueChange={setColor}
              disabled={!!servicio && !servicio.allowsColor}
              trackColor={{ true: c.primary }}
            />
          </View>

          <Text style={styles.label}>Papel</Text>
          <View style={styles.papeles}>
            {PAPELES.map((p) => {
              const on = papel === p;
              return (
                <TouchableOpacity key={p} style={[styles.papel, on && styles.papelOn]} onPress={() => setPapel(p)}>
                  <Text style={[styles.papelText, { color: on ? '#fff' : c.textPrimary }]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Precio */}
          {servicio && (
            <View style={styles.resumen}>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>{precio.hojas} hoja(s) × {copias} copia(s)</Text>
                <Text style={styles.resumenValor}>${precio.total.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.enviar, (enviando || cargando) && { opacity: 0.6 }]} onPress={enviar} disabled={enviando || cargando}>
          <Text style={styles.enviarText}>
            {enviando ? 'Enviando…' : servicio ? `Enviar impresión · $${precio.total.toFixed(2)}` : 'Enviar impresión'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.cardBorder,
  },
  headBtn: { padding: 6, width: 70 },
  headBtnText: { fontSize: ui.size.base, color: c.textPrimary, fontWeight: ui.weight.semibold },
  title: { fontSize: ui.size.lg, fontWeight: ui.weight.bold, color: c.textPrimary },

  step: { fontSize: ui.size.base, fontWeight: ui.weight.bold, color: c.textPrimary, marginTop: 20, marginBottom: 10 },
  vacio: { fontSize: ui.size.sm, color: c.textMuted },

  formatos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  formato: { borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg, paddingHorizontal: 14, paddingVertical: 12, minWidth: 100 },
  formatoOn: { borderColor: c.primary, backgroundColor: c.primaryLight },
  formatoNombre: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary },
  formatoPrecio: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 2 },

  subidor: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
    borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg, borderStyle: 'dashed', backgroundColor: '#F7F7F8',
  },
  subidorIcon: { fontSize: 24 },
  subidorText: { flex: 1, fontSize: ui.size.sm, color: c.textSecondary },

  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  label: { fontSize: ui.size.sm, color: c.textPrimary, flex: 1, paddingRight: 12 },
  numInput: { width: 70, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.md, paddingHorizontal: 12, paddingVertical: 8, textAlign: 'center', color: c.textPrimary },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.full },
  stepBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: c.textPrimary },
  stepQty: { minWidth: 32, textAlign: 'center', fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary },

  papeles: { flexDirection: 'row', gap: 8, marginTop: 8 },
  papel: { borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.full, paddingHorizontal: 16, paddingVertical: 8 },
  papelOn: { backgroundColor: c.primary, borderColor: c.primary },
  papelText: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold },

  resumen: { marginTop: 20, padding: 16, borderRadius: ui.radius.lg, backgroundColor: '#F7F7F8' },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumenLabel: { color: c.textSecondary, fontSize: ui.size.sm },
  resumenValor: { color: c.textPrimary, fontSize: ui.size.lg, fontWeight: ui.weight.extrabold },

  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: c.cardBorder },
  enviar: { backgroundColor: c.primary, borderRadius: ui.radius.full, paddingVertical: 16, alignItems: 'center' },
  enviarText: { color: '#fff', fontSize: ui.size.base, fontWeight: ui.weight.bold },
});
