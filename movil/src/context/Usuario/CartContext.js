import React, { createContext, useCallback, useMemo, useState } from 'react';

export const CartContext = createContext(null);

const DELIVERY_FEE = 5.78;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { product, quantity }

  const addToCart = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback(productId => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems(prev => {
      if (quantity <= 0) return prev.filter(i => i.product.id !== productId);
      return prev.map(i => (i.product.id === productId ? { ...i, quantity } : i));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemsCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const itemsTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.salePrice * i.quantity, 0),
    [items]
  );

  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const subtotal = itemsTotal + deliveryFee;

  const value = {
    items,
    itemsCount,
    itemsTotal,
    deliveryFee,
    subtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartContext;
