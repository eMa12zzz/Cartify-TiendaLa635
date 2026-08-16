/*
 * ============================================================
 * PRIMER INGRESO — primerIngreso.js
 * ============================================================
 * Una marca de un solo uso que dice "esta persona acaba de crear su cuenta".
 * Sirve para una cosa concreta: que el mapa de bienvenida salga la primera vez
 * y nunca más.
 *
 * POR QUÉ ACÁ Y NO EN LA BASE. La pregunta "¿es nuevo?" parece de servidor,
 * pero el único momento del sistema donde se sabe con certeza absoluta es el
 * instante en que se verifica el código del registro (ver Verification.jsx), y
 * el login que le sigue pasa en el MISMO navegador, segundos después. Guardar
 * un campo en el cliente obligaría a un endpoint nuevo, una migración para los
 * que ya existen, y a colgarlo de un router que hoy no valida a nadie.
 *
 * Y el modo de fallar es bueno: si la marca se pierde —otro navegador, modo
 * incógnito, alguien que limpia datos— el peor caso es que un recién llegado
 * entre directo a la tienda en vez de al mapa, y tiene el selector de dirección
 * en el encabezado para arreglarlo. Lo que había antes fallaba al revés: TODO
 * el mundo veía el mapa en CADA inicio de sesión, para siempre.
 *
 * Lo que NO se hizo, y por qué: deducirlo de que el cliente no tenga
 * direcciones. Suena bien hasta que uno mira que el mapa tiene botón de
 * "Omitir por ahora": quien lo toca no tendría dirección nunca, y volvería a
 * ver el mapa en cada login — castigado por haber dicho que no.
 *
 * Va en utils y no en un hook a propósito: no tiene estado ni ciclo de vida,
 * y quien lo usa lo llama DENTRO de un submit asíncrono, no suscrito a él.
 * ============================================================
 */

const LLAVE = 'kartify:recien-registrado';

/*
 * localStorage puede tirar excepción —modo incógnito de Safari, almacenamiento
 * lleno, permisos—. Que el saludo del mapa no salga jamás justifica un aviso;
 * que reviente el registro entero, de ninguna manera.
 */
export const marcarRecienRegistrado = () => {
  try {
    localStorage.setItem(LLAVE, '1');
  } catch {
    // Sin marca la persona entra directo a la tienda. Se pierde el saludo, no la cuenta.
  }
};

/*
 * Lee Y BORRA. Es de un solo uso a propósito: si solo leyera, alguien que
 * cierra sesión y vuelve a entrar en el mismo navegador vería el mapa otra vez,
 * que es exactamente la molestia que esto viene a quitar.
 */
export const consumirRecienRegistrado = () => {
  try {
    const marcado = localStorage.getItem(LLAVE) === '1';
    if (marcado) localStorage.removeItem(LLAVE);
    return marcado;
  } catch {
    return false;
  }
};
