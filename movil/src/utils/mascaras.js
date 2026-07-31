/*
 * ============================================================
 * MÁSCARAS DE ENTRADA — mascaras.js
 * ============================================================
 * Puerto de `frontend/src/utils/mascaras.js`. Mismas reglas, misma salida: un
 * DUI escrito en el celular tiene que quedar guardado igual que uno escrito en
 * la computadora, o buscar al cliente después no encuentra nada.
 *
 * Lo que no se copió: `alEscribir`, que manipula `e.target.value` del DOM. En
 * React Native el `onChangeText` ya entrega el texto pelado, así que la
 * pantalla llama al formateador directo.
 * ============================================================
 */

const soloDigitos = (valor) => String(valor || '').replace(/\D/g, '');

// DUI salvadoreño: 8 dígitos, guion y el verificador. 01234567-8
export const formatearDui = (valor) => {
  const d = soloDigitos(valor).slice(0, 9);
  if (d.length <= 8) return d;
  return `${d.slice(0, 8)}-${d.slice(8)}`;
};

// Teléfono de El Salvador: 8 dígitos partidos a la mitad. 7890-1234
export const formatearTelefono = (valor) => {
  const d = soloDigitos(valor).slice(0, 8);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
};

// Está completo (no si está bien: para eso están las validaciones).
export const duiCompleto = (valor) => soloDigitos(valor).length === 9;
export const telefonoCompleto = (valor) => soloDigitos(valor).length === 8;

// Cuántos caracteres puede tener el campo ya formateado (para maxLength).
export const LARGO_DUI = 10;        // 8 + guion + 1
export const LARGO_TELEFONO = 9;    // 4 + guion + 4
