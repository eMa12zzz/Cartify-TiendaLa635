import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { giftCardService } from '../api/giftCardService';
import { useAuth } from './useAuth';

/*
 * useSaldo — el saldo digital del cliente y el canje de tarjetas.
 *
 * El saldo NUNCA se calcula acá: siempre viene del servidor. Si lo lleváramos
 * en el navegador, cualquiera lo edita desde las herramientas del desarrollador
 * y se regala dinero.
 */
export const useSaldo = () => {
  const { user } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [canjeando, setCanjeando] = useState(false);

  const cargar = useCallback(async () => {
    if (!user?.id) { setCargando(false); return; }
    try {
      const d = await giftCardService.getBalance(user.id);
      setSaldo(Number(d.balance) || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, [user?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const canjear = async (codigo) => {
    const limpio = String(codigo || '').trim().toUpperCase();
    if (!limpio) { toast.error('Escriba el código de su tarjeta'); return false; }
    if (!user?.id) { toast.error('Inicie sesión para canjear'); return false; }

    setCanjeando(true);
    try {
      const r = await giftCardService.redeem(limpio, user.id);
      // El saldo que devuelve el servidor manda sobre cualquier cuenta local.
      setSaldo(Number(r.balance) || 0);
      toast.success(r.message);
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || 'No se pudo canjear la tarjeta');
      return false;
    } finally {
      setCanjeando(false);
    }
  };

  return { saldo, cargando, canjeando, canjear, recargar: cargar };
};
