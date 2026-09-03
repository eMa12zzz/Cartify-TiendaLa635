/*
 * ============================================================
 * PAGOS — el saldo digital y los métodos guardados
 * ============================================================
 * El equivalente de `frontend/src/pages/cliente/MetodoPago.jsx`: la tarjeta
 * de saldo (con su canje) arriba, la lista de métodos de pago guardados
 * abajo. Los dos widgets ya existían sueltos —el canje vive en
 * Checkout.js, con `getSaldo`/`canjearTarjeta`— y aquí se juntan en su
 * propio apartado, como en la web.
 *
 * ── No hay pasarela, ni aquí ni en la web ──
 *
 * Guardar un método de pago es solo tipo, alias y los últimos 4 dígitos —
 * nunca el número completo ni el CVV. El backend los recorta igual aunque
 * se mandaran (`updatePaymentMethods` en clientController.js). El cobro de
 * verdad pasa por caja o al entregar; "tarjeta" aquí es la intención de
 * pagar con tarjeta, no un cargo. Mismo criterio que Checkout.js.
 *
 * ── Guardar (y borrar) es mandar la lista completa ──
 *
 * El endpoint reemplaza el arreglo entero, igual que direcciones: agregar o
 * quitar un método es guardar la lista ya modificada.
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Banknote, CreditCard, Gift, Trash2 } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useAuth } from '../../hooks/useAuth';
import { useTema } from '../../context/TemaContext';
import { useAviso } from '../../context/AvisoContext';
import { getCliente, actualizarMetodosPago } from '../../api/clienteApi';
import { getSaldo, canjearTarjeta } from '../../api/giftCardApi';
import BarraCuenta from '../../components/Cuenta/BarraCuenta';
import Boton from '../../components/UI/Boton';

const ICONO_TIPO = { tarjeta: CreditCard, efectivo: Banknote };

const Pagos = ({ alVolver }) => {
  const { user } = useAuth();
  const { colores } = useTema();
  const { avisar } = useAviso();

  const [saldo, setSaldo] = useState(0);
  const [metodos, setMetodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [codigoTarjeta, setCodigoTarjeta] = useState('');
  const [canjeando, setCanjeando] = useState(false);

  const [escribiendo, setEscribiendo] = useState(false);
  const [nuevo, setNuevo] = useState({ tipo: 'tarjeta', alias: '', last4: '' });

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [cliente, saldoRes] = await Promise.all([
        getCliente(user.id),
        // El saldo es prescindible: sin él se ve $0.00 y se puede seguir
        // usando la pantalla, en vez de una que no carga por completo.
        getSaldo(user.id).catch(() => null),
      ]);
      const lista = Array.isArray(cliente?.paymentMethods) ? cliente.paymentMethods : [];
      setMetodos(lista);
      setSaldo(Number(saldoRes?.balance) || 0);
    } catch (e) {
      setError(e?.message || 'No se pudo cargar su información de pagos');
    } finally {
      setCargando(false);
    }
  }, [user?.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const canjear = async () => {
    const limpio = codigoTarjeta.trim().toUpperCase();
    if (!limpio) return;

    setCanjeando(true);
    try {
      const r = await canjearTarjeta(limpio, user.id);
      setSaldo(Number(r?.balance) || 0);
      setCodigoTarjeta('');
      avisar(r?.message || 'Tarjeta canjeada');
    } catch (e) {
      avisar(e?.message || 'No se pudo canjear la tarjeta', 'error');
    } finally {
      setCanjeando(false);
    }
  };

  const agregar = async () => {
    if (!nuevo.alias.trim()) {
      avisar('Póngale un nombre a este método (Visa, BAC…)', 'error');
      return;
    }
    if (nuevo.tipo === 'tarjeta' && !/^\d{4}$/.test(nuevo.last4.trim())) {
      avisar('Los últimos 4 dígitos son 4 números', 'error');
      return;
    }

    const lista = [...metodos, { ...nuevo, alias: nuevo.alias.trim(), last4: nuevo.last4.trim() }];
    setGuardando(true);
    try {
      await actualizarMetodosPago(user.id, lista);
      setMetodos(lista);
      setNuevo({ tipo: 'tarjeta', alias: '', last4: '' });
      setEscribiendo(false);
      avisar('Método de pago guardado');
    } catch (e) {
      avisar(e?.message || 'No se pudo guardar el método de pago', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = (indice) => {
    const metodo = metodos[indice];

    Alert.alert(
      '¿Quitar este método?',
      `${metodo.alias}\n\nEsto no lo cobra ni lo devuelve — solo lo saca de esta lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            const quedan = metodos.filter((_, i) => i !== indice);
            setGuardando(true);
            try {
              await actualizarMetodosPago(user.id, quedan);
              setMetodos(quedan);
              avisar('Método de pago quitado');
            } catch (e) {
              avisar(e?.message || 'No se pudo quitar el método de pago', 'error');
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={estilos.pantalla}>
      <BarraCuenta titulo="Pagos" alVolver={alVolver} />

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.marca} />
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.errorTitulo}>No se pudo cargar su información de pagos</Text>
          <Text style={estilos.errorTexto}>{error}</Text>
          <View style={estilos.botonError}>
            <Boton
              texto="Reintentar"
              alPresionar={cargar}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
            />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.cuerpo}>
          {/* ── Saldo digital ── */}
          <View style={[estilos.tarjetaSaldo, { backgroundColor: colores.marcaSuave }]}>
            <View style={estilos.filaSaldo}>
              <View style={[estilos.iconoSaldo, { backgroundColor: colores.marcaTenue }]}>
                <Gift size={19} color={colores.marca} strokeWidth={2} />
              </View>
              <View>
                <Text style={estilos.etiquetaSaldo}>Su saldo</Text>
                <Text style={[estilos.valorSaldo, { color: colores.marcaOscuro }]}>
                  ${saldo.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={estilos.filaCanje}>
              <TextInput
                value={codigoTarjeta}
                onChangeText={(v) => setCodigoTarjeta(v.toUpperCase())}
                placeholder="¿Tiene una tarjeta? 635-XXXX-XXXX"
                placeholderTextColor={COLORES.marcador}
                style={estilos.campoCanje}
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Código de tarjeta de regalo"
              />
              <Pressable
                onPress={canjear}
                disabled={canjeando || !codigoTarjeta.trim()}
                style={({ pressed }) => [
                  estilos.botonCanje,
                  { backgroundColor: colores.marca },
                  pressed && { backgroundColor: colores.marcaOscuro },
                  (canjeando || !codigoTarjeta.trim()) && estilos.botonCanjeApagado,
                ]}
              >
                <Text style={estilos.botonCanjeTexto}>{canjeando ? 'Canjeando…' : 'Canjear'}</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Métodos guardados ── */}
          <Text style={estilos.tituloSeccion}>Métodos guardados</Text>

          {metodos.length === 0 && !escribiendo && (
            <Text style={estilos.vacioTexto}>Sin métodos de pago guardados todavía.</Text>
          )}

          <View style={estilos.lista}>
            {metodos.map((metodo, indice) => {
              const Icono = ICONO_TIPO[metodo.type] || CreditCard;
              return (
                <View key={`${metodo.alias}-${indice}`} style={estilos.tarjetaMetodo}>
                  <Icono size={19} color={colores.marca} strokeWidth={2} />

                  <View style={estilos.datosMetodo}>
                    <Text style={estilos.aliasMetodo}>{metodo.alias}</Text>
                    {!!metodo.last4 && (
                      <Text style={estilos.detalleMetodo}>Termina en {metodo.last4}</Text>
                    )}
                  </View>

                  <Pressable
                    onPress={() => borrar(indice)}
                    disabled={guardando}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${metodo.alias}`}
                    style={({ pressed }) => [
                      estilos.botonBorrar,
                      pressed && estilos.botonBorrarPresionado,
                      guardando && estilos.botonBorrarApagado,
                    ]}
                  >
                    <Trash2 size={16} color={COLORES.error} strokeWidth={1.9} />
                  </Pressable>
                </View>
              );
            })}
          </View>

          {escribiendo ? (
            <View style={[estilos.formulario, { borderColor: colores.marcaSuave }]}>
              {/* Sin <select> nativo: dos píldoras hacen lo mismo con menos
                  fricción en un teléfono. */}
              <View style={estilos.filaTipo}>
                {[
                  { valor: 'tarjeta', texto: 'Tarjeta', Icono: CreditCard },
                  { valor: 'efectivo', texto: 'Efectivo', Icono: Banknote },
                ].map(({ valor, texto, Icono }) => {
                  const activo = nuevo.tipo === valor;
                  return (
                    <Pressable
                      key={valor}
                      onPress={() => setNuevo((m) => ({ ...m, tipo: valor }))}
                      style={[
                        estilos.pildoraTipo,
                        activo && { borderColor: colores.marca, backgroundColor: colores.marcaTenue },
                      ]}
                    >
                      <Icono size={15} color={activo ? colores.marca : COLORES.textoSuave} strokeWidth={2} />
                      <Text style={[estilos.pildoraTipoTexto, activo && { color: colores.marca }]}>
                        {texto}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={nuevo.alias}
                onChangeText={(v) => setNuevo((m) => ({ ...m, alias: v }))}
                placeholder="Nombre (Visa, BAC, Efectivo…)"
                placeholderTextColor={COLORES.marcador}
                style={estilos.campo}
                accessibilityLabel="Nombre del método de pago"
              />

              {nuevo.tipo === 'tarjeta' && (
                <TextInput
                  value={nuevo.last4}
                  onChangeText={(v) => setNuevo((m) => ({ ...m, last4: v.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="Últimos 4 dígitos"
                  placeholderTextColor={COLORES.marcador}
                  style={estilos.campo}
                  keyboardType="number-pad"
                  maxLength={4}
                  accessibilityLabel="Últimos 4 dígitos de la tarjeta"
                />
              )}

              <Boton
                texto="Guardar método de pago"
                alPresionar={agregar}
                cargando={guardando}
                color={colores.marca}
                colorPresionado={colores.marcaOscuro}
              />
              <Pressable
                onPress={() => {
                  setEscribiendo(false);
                  setNuevo({ tipo: 'tarjeta', alias: '', last4: '' });
                }}
                hitSlop={8}
              >
                <Text style={estilos.enlaceTenue}>Cancelar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setEscribiendo(true)} hitSlop={8}>
              <Text style={[estilos.enlace, { color: colores.marca }]}>
                {metodos.length === 0 ? '+ Agregar mi primer método de pago' : '+ Agregar otro método'}
              </Text>
            </Pressable>
          )}
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
    paddingHorizontal: 32,
    gap: 8,
  },
  errorTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  errorTexto: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  botonError: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
  cuerpo: {
    padding: 16,
    paddingBottom: 30,
    gap: 14,
  },
  tarjetaSaldo: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  filaSaldo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconoSaldo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiquetaSaldo: {
    fontSize: 12.5,
    color: COLORES.textoSuave,
  },
  valorSaldo: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  filaCanje: {
    flexDirection: 'row',
    gap: 8,
  },
  campoCanje: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    paddingHorizontal: 13,
    height: 44,
    fontSize: 13,
    color: COLORES.texto,
    backgroundColor: COLORES.fondo,
    paddingVertical: 0,
  },
  botonCanje: {
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCanjeApagado: {
    opacity: 0.5,
  },
  botonCanjeTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tituloSeccion: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORES.textoTenue,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  vacioTexto: {
    fontSize: 13.5,
    color: COLORES.textoSuave,
  },
  lista: {
    gap: 10,
  },
  tarjetaMetodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    padding: 14,
  },
  datosMetodo: {
    flex: 1,
    gap: 1,
  },
  aliasMetodo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORES.tituloVentaja,
  },
  detalleMetodo: {
    fontSize: 12.5,
    color: COLORES.textoSuave,
  },
  botonBorrar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonBorrarPresionado: {
    backgroundColor: '#FDECEC',
  },
  botonBorrarApagado: {
    opacity: 0.5,
  },
  formulario: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 9,
  },
  filaTipo: {
    flexDirection: 'row',
    gap: 8,
  },
  pildoraTipo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
  },
  pildoraTipoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORES.textoSuave,
  },
  campo: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    paddingHorizontal: 13,
    height: 44,
    fontSize: 13.5,
    color: COLORES.texto,
    backgroundColor: COLORES.fondo,
    paddingVertical: 0,
  },
  enlace: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 4,
  },
  enlaceTenue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORES.textoSuave,
    textAlign: 'center',
    paddingVertical: 4,
  },
});

export default Pagos;
