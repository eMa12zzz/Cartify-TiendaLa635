import { useState, useEffect, useCallback } from 'react';
import { giftCardService } from '../../api/Usuario/giftCardService';
import { useAuth } from '../useAuth';
import { aviso } from '../../utils/aviso';

/*
 * useSaldo — el saldo digital del cliente y el canje de tarjetas de regalo.
 * Puerto de `frontend/src/hooks/useSaldo.js`.
 *
 * El saldo NUNCA se calcula acá: siempre viene del servidor. Si lo lleváramos
 * en el teléfono, se podría editar y regalar dinero.
 */
export const useSaldo = () => {
  const { user, esCliente } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [canjeando, setCanjeando] = useState(false);

  const cargar = useCallback(async () => {
    if (!esCliente) { setCargando(false); return; }
    try {
      const d = await giftCardService.getBalance(user.id);
      setSaldo(Number(d.balance) || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, [user?.id, esCliente]);

  useEffect(() => { cargar(); }, [cargar]);

  const canjear = async (codigo) => {
    const limpio = String(codigo || '').trim().toUpperCase();
    if (!limpio) { aviso('Escriba el código de su tarjeta'); return false; }
    if (!esCliente) { aviso('Inicie sesión con su cuenta de cliente para canjear'); return false; }

    setCanjeando(true);
    try {
      const r = await giftCardService.redeem(limpio, user.id);
      // El saldo que devuelve el servidor manda sobre cualquier cuenta local.
      setSaldo(Number(r.balance) || 0);
      aviso(r.message);
      return true;
    } catch (e) {
      aviso(e?.message || 'No se pudo canjear la tarjeta');
      return false;
    } finally {
      setCanjeando(false);
    }
  };

  return { saldo, cargando, canjeando, canjear, recargar: cargar };
};

export default useSaldo;
