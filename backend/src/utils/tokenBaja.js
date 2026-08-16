import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";

/*
 * ============================================================
 * EL ENLACE PARA DARSE DE BAJA — tokenBaja.js
 * ============================================================
 * "Dejar de recibirlos" tiene que funcionar de UN clic, sin pedir la
 * contraseña. Antes el enlace del pie llevaba a Mi Cuenta > Notificaciones, y
 * ahí lo primero que se encuentra quien no tiene la sesión abierta es un
 * formulario de login. Pedirle a alguien que inicie sesión para dejar de
 * recibir correos que no pidió es la forma elegante de no dejarlo salir.
 *
 * POR QUÉ UN TOKEN FIRMADO Y NO EL ID A SECAS
 * Con un `/baja?cliente=<id>` en la URL, cualquiera que cambie el número da de
 * baja a otra persona: los ids de Mongo van casi en orden y se adivinan. El
 * token va firmado con la misma llave del resto de la app, así que solo el
 * servidor puede fabricarlo y nadie puede fabricar el de otro.
 *
 * VENCE EN UN AÑO, no en una hora. Un correo se guarda y se abre meses
 * después; un enlace de baja que caducó es una puerta cerrada con llave. Un
 * año es tiempo de sobra y limita el daño si el correo termina reenviado.
 *
 * Lleva `clave` adentro para que el enlace dé de baja SOLO del aviso que traía
 * ese correo. Quien se cansa de las promociones no está pidiendo que dejen de
 * avisarle cuando su pedido va en camino.
 * ============================================================
 */

const PROPOSITO = "baja-notificaciones";

export const firmarTokenBaja = (clienteId, clave) =>
  jsonwebtoken.sign(
    { id: String(clienteId), clave, proposito: PROPOSITO },
    config.JWT.secret,
    { expiresIn: "365d" }
  );

/*
 * @returns {{ id: string, clave: string } | null} — null si el token es falso,
 *   venció o es de otra cosa (un token de sesión, por ejemplo). El `proposito`
 *   es lo que impide que una cookie de sesión robada sirva para esto.
 */
export const leerTokenBaja = (token) => {
  try {
    const datos = jsonwebtoken.verify(token, config.JWT.secret);
    if (datos?.proposito !== PROPOSITO) return null;
    return { id: datos.id, clave: datos.clave };
  } catch {
    return null;
  }
};

/*
 * La dirección completa que va en el pie del correo. La pantalla del frontend
 * lee el token de la URL y le pide al servidor que lo aplique.
 */
export const enlaceDeBaja = (clienteId, clave) =>
  `${config.tienda.url}/baja?t=${encodeURIComponent(firmarTokenBaja(clienteId, clave))}`;
