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

// Los dígitos del DUI, sin el guion.
const digitosDelDui = (valor) => String(valor || '').replace(/\D/g, '');

/*
 * ¿Cuadra el dígito verificador? Es la MISMA cuenta que la web
 * (frontend/src/utils/validaciones.js `duiEsValido`): los 8 primeros dígitos se
 * multiplican por 9, 8, 7...2, se suman, y el verificador tiene que ser
 * (10 - suma % 10) % 10. Ese último % 10 no es adorno: cuando la suma cierra en
 * 0 el verificador es 0, no 10, y sin él se rechazaría todo DUI terminado en 0.
 *
 * Esto solo descarta un número inventado al azar; NO confirma que la persona
 * exista ni que el documento sea suyo — ese registro vive en el RNPN y no tiene
 * una API pública para consultarlo.
 */
export const duiEsValido = (valor) => {
  const d = digitosDelDui(valor);
  if (d.length !== 9) return false;
  // "00000000-0" y "11111111-1" cuadran con la aritmética pero no son de nadie:
  // es lo que sale cuando alguien llena el campo por salir del paso.
  if (/^(\d)\1{8}$/.test(d)) return false;
  let suma = 0;
  for (let i = 0; i < 8; i++) suma += Number(d[i]) * (9 - i);
  return (10 - (suma % 10)) % 10 === Number(d[8]);
};

/*
 * DUI del cliente: OPCIONAL, igual que en la web (`reglaDuiOpcional`). Mucha
 * gente del barrio no lo anda a mano y perder un registro por eso no vale la
 * pena. Vacío pasa; si escribió algo, tiene que estar completo (9 dígitos) y
 * cuadrar el verificador.
 */
export const validarDui = (valor) => {
  const d = digitosDelDui(valor);
  if (!d.length) return null; // no lo puso: perfecto, seguimos
  if (d.length < 9) return 'El DUI lleva 9 dígitos (12345678-9)';
  return duiEsValido(valor) ? null : 'Ese DUI no parece correcto, revise los números';
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
