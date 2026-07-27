/*
 * ============================================================
 * VALIDACIONES — validaciones.js
 * ============================================================
 * Reglas reutilizables para los formularios del admin. La idea es que un
 * campo numérico no acepte letras, ni negativos donde no tiene sentido, ni
 * valores que rompan el negocio (vender por debajo del costo, un 2x1 que
 * cobra 2, una tasa de canje en 0 que causaría división entre cero...).
 *
 * Hay dos sabores porque los forms del proyecto usan dos estilos:
 *   - `regla*`  → objetos para react-hook-form (ProductFormModal, etc.)
 *   - funciones → para los forms con useState suelto (Promociones, Fidelidad)
 * ============================================================
 */

// ── Teclas ──────────────────────────────────────────────────
// En un input number el navegador deja escribir "e", "+" y "-": los bloqueamos.
export const bloquearTeclasNumero = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
};

// Para códigos y teléfonos: solo dígitos y guiones.
export const bloquearNoDigitos = (e) => {
  const permitidas = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', '-'];
  if (permitidas.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/[0-9]/.test(e.key)) e.preventDefault();
};

// ── Reglas para react-hook-form ─────────────────────────────
export const reglaPrecio = (etiqueta = 'El precio') => ({
  required: `${etiqueta} es obligatorio`,
  validate: (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return 'Debe ser un número válido';
    if (n <= 0) return `${etiqueta} debe ser mayor que 0`;
    if (n > 100000) return `${etiqueta} parece demasiado alto`;
    return true;
  },
});

export const reglaEntero = (etiqueta, minimo = 0) => ({
  required: `${etiqueta} es obligatorio`,
  validate: (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return 'Debe ser un número válido';
    if (!Number.isInteger(n)) return `${etiqueta} debe ser un número entero`;
    if (n < minimo) return `${etiqueta} no puede ser menor que ${minimo}`;
    return true;
  },
});

// DUI salvadoreño: 8 dígitos, guion y 1 dígito (12345678-9).
export const reglaDui = {
  required: 'El DUI es obligatorio',
  pattern: { value: /^\d{8}-\d$/, message: 'Formato de DUI: 12345678-9' },
};

// Teléfono salvadoreño: 8 dígitos, normalmente 1234-5678.
export const reglaTelefono = {
  required: 'El teléfono es obligatorio',
  pattern: { value: /^\d{4}-?\d{4}$/, message: 'Formato de teléfono: 1234-5678' },
};

export const reglaCodigoBarras = {
  required: 'El código de barras es obligatorio',
  pattern: { value: /^\d{6,20}$/, message: 'Solo dígitos (entre 6 y 20)' },
};

// ── Funciones sueltas (forms con useState) ──────────────────

// Devuelve el número si es válido dentro del rango, o null si no lo es.
export const numeroEnRango = (valor, { min = -Infinity, max = Infinity, entero = false } = {}) => {
  const n = Number(valor);
  if (valor === '' || valor === null || Number.isNaN(n)) return null;
  if (entero && !Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
};

/*
 * Avisa si una promoción deja productos vendiéndose POR DEBAJO DEL COSTO.
 *
 * No lo bloquea: una tienda puede querer un producto gancho a pérdida a
 * propósito. Pero debe ser una decisión, no un accidente — un 50% sobre algo
 * con 40% de margen pierde plata en cada venta, y eso no se nota hasta que
 * alguien mira el cierre del mes.
 *
 * Devuelve un aviso, o null si todo deja margen.
 */
export const avisoVentaBajoCosto = ({ tipo, items, buyQty, payQty, costos = {}, precios = {} }) => {
  /*
   * Un anuncio no cambia el precio, así que no puede hacer perder plata. Si el
   * producto ya se vendía bajo costo, ese es un problema del producto y se
   * avisa en su formulario, no aquí.
   */
  if (tipo === 'anuncio') return null;

  const bajoCosto = [];

  items.forEach((it) => {
    const costo = Number(costos[it.productId]) || 0;
    const normal = Number(precios[it.productId]) || 0;
    if (costo <= 0) return; // sin costo cargado no hay nada que comparar

    let precioFinal = normal;
    if (tipo === 'descuento') {
      precioFinal = normal * (1 - (Number(it.discount) || 0) / 100);
    } else if (tipo === 'precio_fijo') {
      precioFinal = Number(it.fixedPrice) || 0;
    } else if (tipo === 'nxm') {
      // En un 3x2 cada unidad sale al promedio de lo que se paga.
      const compra = Number(buyQty) || 2;
      const paga = Number(payQty) || 1;
      precioFinal = compra > 0 ? (normal * paga) / compra : normal;
    }

    if (precioFinal < costo) {
      bajoCosto.push({ nombre: it.name, precioFinal, costo });
    }
  });

  if (!bajoCosto.length) return null;

  const primero = bajoCosto[0];
  const resto = bajoCosto.length - 1;
  return `"${primero.nombre}" quedaría a $${primero.precioFinal.toFixed(2)} y le cuesta $${primero.costo.toFixed(2)}: pierde $${(primero.costo - primero.precioFinal).toFixed(2)} en cada venta` +
    (resto > 0 ? ` (y ${resto} producto${resto > 1 ? 's' : ''} más)` : '');
};

/*
 * Valida una promoción completa antes de guardarla.
 * Devuelve un mensaje de error, o null si todo está bien.
 */
export const validarPromocion = ({ tipo, items, buyQty, payQty, precios = {} }) => {
  if (!items.length) return 'Agrega al menos un producto';

  // El anuncio solo necesita productos: no hay importes que revisar.
  if (tipo === 'anuncio') return null;

  if (tipo === 'descuento') {
    for (const it of items) {
      const d = numeroEnRango(it.discount, { min: 0, max: 100 });
      if (d === null) return `El descuento de "${it.name}" debe estar entre 0 y 100`;
      if (d === 0) return `"${it.name}" tiene 0% de descuento`;
    }
  }

  if (tipo === 'precio_fijo') {
    for (const it of items) {
      const p = numeroEnRango(it.fixedPrice, { min: 0.01 });
      if (p === null) return `El precio de "${it.name}" debe ser mayor que 0`;
      // Si el "precio de oferta" es mayor al normal, no es una oferta.
      const normal = precios[it.productId];
      if (normal && p >= normal) return `El precio de oferta de "${it.name}" debe ser menor a su precio normal ($${normal})`;
    }
  }

  if (tipo === 'nxm') {
    const compra = numeroEnRango(buyQty, { min: 2, entero: true });
    const paga = numeroEnRango(payQty, { min: 1, entero: true });
    if (compra === null) return 'En "Compra" pon un número entero de 2 o más';
    if (paga === null) return 'En "Paga" pon un número entero de 1 o más';
    if (paga >= compra) return 'En un NxM, "Paga" debe ser menor que "Compra" (ej. compra 2, paga 1)';
  }

  return null;
};
