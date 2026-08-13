// Igual que products.js y cart.js: mock por ahora, con la línea real
// comentada arriba de cada función para cuando el backend esté listo.

export async function getOrderById(id) {
  // return peticion(`/orders/${id}`);
  return {
    id,
    status: 'in_progress', // 'in_progress' | 'completed' | 'cancelled'
    statusLabel: 'En proceso',
    estimatedMinutes: 30,
    placedAt: 'Apr 5, 2022, 10:07 AM',
    paymentMethod: 'Mastercard •••• 3434',
    deliveryAddress: '2118 Thornridge Cir. Syracuse, Connecticut 35624',
    shippingCost: 4.78,
    serviceFee: 128.78,
    total: 134.56,
    items: [
      { id: 'naranjas-1', name: 'Naranjas 1.5-2 lb', price: 25.98, quantity: 1 },
    ],
  };
}

export async function cancelOrder(id) {
  // return peticion(`/orders/${id}/cancel`, { metodo: 'PATCH' });
  return { id, status: 'cancelled' };
}
