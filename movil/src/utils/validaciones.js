/*
 * ============================================================
 * VALIDACIONES — validaciones.js
 * ============================================================
 * Las mismas reglas que `frontend/src/utils/validaciones.js`, pero con la
 * forma que pide un formulario sin react-hook-form: cada función recibe el
 * valor y devuelve el mensaje de error, o `null` si el campo está bien.
 *
 * Se validan solo los campos que existen en Iniciar sesión y Registrarse; las
 * reglas de precios y promociones son del panel de administración y no tienen
 * nada que hacer en la app del cliente.
 * ============================================================
 */

const vacio = (valor) => !String(valor || '').trim();

export const requerido = (valor, mensaje) => (vacio(valor) ? mensaje : null);

export const validarCorreo = (valor) => {
  if (vacio(valor)) return 'El correo es requerido';
  // El mismo patrón de la web: algo, arroba, algo, punto, algo.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return 'Formato inválido';
  return null;
};

export const validarContrasena = (valor) => {
  if (vacio(valor)) return 'La contraseña es requerida';
  if (valor.length < 6) return 'Mínimo 6 caracteres';
  return null;
};

// DUI salvadoreño: 8 dígitos, guion y 1 dígito (12345678-9).
export const validarDui = (valor) => {
  if (vacio(valor)) return 'El DUI es obligatorio';
  if (!/^\d{8}-\d$/.test(valor)) return 'Formato de DUI: 12345678-9';
  return null;
};

// Teléfono salvadoreño: 8 dígitos, normalmente 1234-5678.
export const validarTelefono = (valor) => {
  if (vacio(valor)) return 'El teléfono es obligatorio';
  if (!/^\d{4}-?\d{4}$/.test(valor)) return 'Formato de teléfono: 1234-5678';
  return null;
};

/*
 * Corre un objeto de reglas contra un objeto de valores y devuelve los errores
 * encontrados. Existe para que las pantallas no repitan ocho `if` seguidos:
 *
 *   const errores = validarFormulario(valores, { email: validarCorreo });
 */
export const validarFormulario = (valores, reglas) => {
  const errores = {};
  Object.entries(reglas).forEach(([campo, regla]) => {
    const error = regla(valores[campo]);
    if (error) errores[campo] = error;
  });
  return errores;
};

export const sinErrores = (errores) => Object.keys(errores).length === 0;
