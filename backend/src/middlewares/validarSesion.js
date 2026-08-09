import jsonwebtoken from "jsonwebtoken";
import { config } from "../../config.js";

/*
 * ============================================================
 * VALIDAR SESIÓN — validarSesion.js
 * ============================================================
 * El portero que la API no tenía.
 *
 * Hasta ahora NINGUNA ruta preguntaba quién llamaba. La consecuencia concreta:
 * `GET /registerClient/all` —la lista que usa la pantalla de Clientes—
 * devolvía la base entera de clientes, con hash de contraseña, saldo, DUI,
 * teléfono y direcciones con coordenadas, a cualquiera que preguntara. Y
 * `DELETE /client/:id` borraba una cuenta con un curl. En localhost eso es un
 * susto; el día que el backend suba a Render es la libreta de la tienda
 * publicada en internet.
 *
 * NO HACE FALTA TOCAR EL FRONTEND. La sesión ya viaja sola: axios va con
 * `withCredentials: true` y el login ya deja las cookies firmadas. Este
 * archivo solo empieza a leerlas.
 *
 * LOS DOS CAJONES, TAMBIÉN AQUÍ. El personal usa `authCookie` y el cliente
 * `authCookieCliente`, separadas a propósito porque el dueño es admin Y
 * cliente de su propia tienda con el mismo navegador abierto. Por eso el
 * portero no agarra "la cookie que haya": agarra la que corresponde a lo que
 * la ruta pide. Si tomara cualquiera, la sesión de cliente del dueño le
 * abriría rutas de administración.
 * ============================================================
 */

// Los tipos que firma el login. Ver loginClient.js y loginAdmin.js.
export const PERSONAL = ["Admin", "Employee"];
export const CLIENTE = ["Client"];

/*
 * `permitidos` vacío = basta con tener sesión, de la clase que sea.
 */
export const validarSesion =
  (permitidos = []) =>
  (req, res, next) => {
    const dePersonal = req.cookies?.authCookie;
    const deCliente = req.cookies?.authCookieCliente;

    /*
     * Cuál cookie se mira, y en qué orden. Si la ruta es de personal se mira
     * la del personal primero; si es del cliente, la suya. Cuando no se pide
     * nada en concreto valen las dos.
     */
    const pidePersonal = permitidos.some((t) => PERSONAL.includes(t));
    const candidatas = permitidos.length === 0
      ? [deCliente, dePersonal]
      : pidePersonal
        ? [dePersonal]
        : [deCliente];

    const token = candidatas.find(Boolean);

    if (!token) {
      return res.status(401).json({ message: "Inicie sesión para continuar" });
    }

    try {
      const datos = jsonwebtoken.verify(token, config.JWT.secret);

      if (permitidos.length && !permitidos.includes(datos.userType)) {
        return res.status(403).json({ message: "No tiene permiso para esta acción" });
      }

      /*
       * Queda a mano para el controlador: así una ruta puede comprobar que el
       * id de la URL sea el de quien pregunta, y no el de otro cliente.
       */
      req.usuario = { id: datos.id, tipo: datos.userType };
      return next();
    } catch {
      /*
       * Token vencido o manipulado. Se responde 401 y no 403 a propósito: el
       * interceptor del frontend ya traduce el 401 a "Sesión expirada o
       * inválida", que es exactamente lo que pasó.
       */
      return res.status(401).json({ message: "Su sesión venció. Vuelva a iniciar sesión." });
    }
  };

// Atajos, para que las rutas se lean de un vistazo.
export const soloPersonal = validarSesion(PERSONAL);
export const soloCliente = validarSesion(CLIENTE);
export const conSesion = validarSesion();

/*
 * "Tiene que ser SUYO."
 *
 * Tener sesión no alcanza cuando el id va en la URL: sin esta comprobación,
 * cualquier cliente con cuenta lee o edita lo de otro con solo cambiar el
 * número de la dirección — sus direcciones, sus métodos de pago, su saldo.
 *
 * Va como middleware y no dentro de cada controlador a propósito: son ocho
 * rutas repartidas en cuatro archivos, y ocho copias de la misma comprobación
 * son ocho lugares donde algún día se va a olvidar una.
 *
 * El personal pasa siempre: atender a un cliente es su trabajo.
 *
 * Se usa así, con el nombre del parámetro que lleva el id:
 *   router.route("/:id/addresses").patch(duenoOPersonal("id"), ...)
 */
export const duenoOPersonal = (nombreParam = "id") => [
  conSesion,
  (req, res, next) => {
    if (req.usuario.tipo !== "Client") return next();

    if (req.usuario.id !== req.params[nombreParam]) {
      return res.status(403).json({ message: "No tiene permiso para esta acción" });
    }
    return next();
  },
];
