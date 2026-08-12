import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

/*
 * ============================================================
 * EDAD — EdadContext.js
 * ============================================================
 * Puerto de `frontend/src/context/EdadContext.jsx`. El candado de los productos
 * +18, compartido por la tienda, el detalle y el carrito.
 *
 * `mayorConfirmado` es verdadero cuando el cliente logueado ya tiene un DUI
 * guardado (el DUI se emite a los 18) o cuando confirmó a mano en esta sesión.
 *
 * ── Diferencia con la web ──
 * La web abre un modal que pide el DUI y lo valida. En móvil, para no arrastrar
 * ese modal completo en este lote, la confirmación es un Alert nativo de dos
 * botones ("Soy mayor de 18"). Sigue siendo una barrera BLANDA con registro en
 * la sesión; el DUI real se revisa igual al entregar el pedido.
 * ============================================================
 */
const EdadContext = createContext({ mayorConfirmado: true, pedirConfirmacion: (cb) => cb?.() });

export const useEdad = () => useContext(EdadContext);

export const EdadProvider = ({ children }) => {
  const { user, esCliente } = useAuth();
  const [confirmadoSesion, setConfirmadoSesion] = useState(false);

  // Si el cliente logueado ya tiene DUI, no se le pregunta nunca.
  const mayorPorCuenta = esCliente && !!user?.dui;
  const mayorConfirmado = mayorPorCuenta || confirmadoSesion;

  const pedirConfirmacion = useCallback((cb) => {
    if (mayorConfirmado) { cb?.(); return; }
    Alert.alert(
      'Producto para mayores de 18',
      'Este producto es solo para mayores de edad. El documento se revisa igual al entregar el pedido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Soy mayor de 18',
          onPress: () => { setConfirmadoSesion(true); cb?.(); },
        },
      ]
    );
  }, [mayorConfirmado]);

  const valor = useMemo(
    () => ({ mayorConfirmado, pedirConfirmacion }),
    [mayorConfirmado, pedirConfirmacion]
  );

  return <EdadContext.Provider value={valor}>{children}</EdadContext.Provider>;
};

export default EdadContext;
