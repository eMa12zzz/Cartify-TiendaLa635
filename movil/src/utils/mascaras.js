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

// Fecha de nacimiento: día y mes primero, como se dice acá. 31/12/2000
export const formatearFecha = (valor) => {
  const d = soloDigitos(valor).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

// Está completo (no si está bien: para eso están las validaciones).
export const duiCompleto = (valor) => soloDigitos(valor).length === 9;
export const telefonoCompleto = (valor) => soloDigitos(valor).length === 8;

// Cuántos caracteres puede tener el campo ya formateado (para maxLength).
export const LARGO_DUI = 10;        // 8 + guion + 1
export const LARGO_TELEFONO = 9;    // 4 + guion + 4
export const LARGO_FECHA = 10;      // 2 + barra + 2 + barra + 4

/*
 * "31/12/2000" (lo que se ve en el campo) -> "2000-12-31" (lo que ya manda el
 * <input type="date"> de la web y lo que espera el backend). `null` si está
 * incompleta o si no es una fecha de calendario real.
 *
 * A diferencia del selector nativo del navegador, este campo es texto libre:
 * nada más impide escribir "31/02/2020". Por eso se arma la fecha con el
 * constructor de componentes (año, mes, día) y se compara contra lo que
 * quedó — si el 31 de febrero no existe, JavaScript lo empuja a marzo, y esa
 * vuelta ya no coincide con lo que se escribió.
 */
export const fechaISO = (valor) => {
  const d = soloDigitos(valor);
  if (d.length !== 8) return null;

  const dia = Number(d.slice(0, 2));
  const mes = Number(d.slice(2, 4));
  const anio = Number(d.slice(4, 8));

  const fecha = new Date(anio, mes - 1, dia);
  const esFechaReal =
    fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
  if (!esFechaReal) return null;

  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
};
