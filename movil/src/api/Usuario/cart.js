import api from '../api'; // src/api/api.js (el cliente peticion/ErrorApi que ya tienes para login)

// Cuando el backend de la tienda esté listo, el carrito debería vivir en el
// servidor (asociado al usuario). Por ahora estas funciones son mock, listas
// para que la pantalla no cambie el día que se conecten de verdad.

export async function getCheckoutInfo() {
  // return peticion('/checkout/info');
  return {
    deliveryWindow: 'Entregar mañana, 8am–10am',
    deliveryAddress: '2118 Thornridge Cir. Syracuse, Connecticut 35624',
    paymentMethod: 'Mastercard •••• 3434',
    serviceFee: 128.78,
    shippingCost: 4.78,
  };
}

export async function checkoutCart(payload) {
  // return peticion('/cart/checkout', { metodo: 'POST', cuerpo: payload });
  return {
    orderId: `#${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  };
}
