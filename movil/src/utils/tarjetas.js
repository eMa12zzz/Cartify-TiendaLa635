/*
 * ============================================================
 * TARJETAS — tarjetas.js
 * ============================================================
 * Copia de `frontend/src/utils/tarjetas.js`. Es JavaScript puro —cuentas y
 * texto, nada de navegador— así que se porta tal cual: reconocer la marca por
 * los primeros dígitos, separar el número en grupos mientras se escribe, saber
 * si el número es válido (algoritmo de Luhn, el mismo dígito verificador que
 * traen todas las tarjetas) y revisar que no esté vencida.
 *
 * NADA DE ESTO SALE DEL TELÉFONO. Con el número completo solo se calcula; al
 * servidor viajan la marca, los últimos 4, el titular y el vencimiento.
 * ============================================================
 */

export const soloDigitos = (texto) => String(texto || '').replace(/\D/g, '');

// La marca por los primeros dígitos (el "BIN" de cada red).
export const detectarMarca = (numero) => {
  const d = soloDigitos(numero);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  if (/^(6011|65|64[4-9])/.test(d)) return 'discover';
  return 'otra';
};

export const NOMBRE_MARCA = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  otra: 'Tarjeta',
};

// American Express tiene 15 dígitos; las demás, 16.
export const largoDe = (marca) => (marca === 'amex' ? 15 : 16);

// "4242424242424242" -> "4242 4242 4242 4242"; Amex va 4-6-5.
export const formatearNumero = (numero) => {
  const marca = detectarMarca(numero);
  const d = soloDigitos(numero).slice(0, largoDe(marca));
  const grupos = marca === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  const partes = [];
  let i = 0;
  for (const g of grupos) {
    if (i >= d.length) break;
    partes.push(d.slice(i, i + g));
    i += g;
  }
  return partes.join(' ');
};

// El dígito verificador (Luhn). Detecta casi cualquier error de un dígito.
export const pasaLuhn = (numero) => {
  const d = soloDigitos(numero);
  if (d.length < 12) return false;
  let suma = 0;
  let doble = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (doble) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    suma += n;
    doble = !doble;
  }
  return suma % 10 === 0;
};

// Mientras se escribe el vencimiento: "082" -> "08/2".
export const formatearVencimiento = (texto) => {
  let d = soloDigitos(texto).slice(0, 4);
  // "9" es septiembre: se completa a "09" en vez de esperar un segundo dígito.
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// "08/29" -> { mes: 8, anio: 2029 }, o null si no está completo.
export const leerVencimiento = (texto) => {
  const d = soloDigitos(texto);
  if (d.length !== 4) return null;
  const mes = Number(d.slice(0, 2));
  const anio = 2000 + Number(d.slice(2));
  if (mes < 1 || mes > 12) return null;
  return { mes, anio };
};

// Una tarjeta vence al terminar el mes impreso, no al empezarlo.
export const estaVencida = (mes, anio, hoy = new Date()) => {
  if (!mes || !anio) return false;
  const y = hoy.getFullYear();
  const m = hoy.getMonth() + 1;
  return anio < y || (anio === y && mes < m);
};

export const vencimientoEnTexto = (mes, anio) =>
  mes && anio ? `${String(mes).padStart(2, '0')}/${String(anio).slice(-2)}` : '';

// Cuántos caracteres ocupa el número ya separado en grupos: 16 dígitos + 3
// espacios, o 15 + 2 en Amex. Es el `maxLength` del campo.
export const LARGO_NUMERO = 19;
export const LARGO_VENCIMIENTO = 5; // MM/AA

/*
 * "Visa crédito", "Mastercard débito"… o "Tarjeta" para las guardadas antes de
 * que la app supiera de marcas. Igual que en la web (MetodoPago.jsx).
 */
export const nombreMarcaTipo = (metodo) => {
  const marca = NOMBRE_MARCA[metodo.brand] && metodo.brand !== 'otra' ? NOMBRE_MARCA[metodo.brand] : 'Tarjeta';
  if (!metodo.cardType) return marca;
  return `${marca} ${metodo.cardType === 'debito' ? 'débito' : 'crédito'}`;
};
