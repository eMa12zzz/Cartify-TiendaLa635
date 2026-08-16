import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clientService } from '../api/clientService';

/*
 * ============================================================
 * DARSE DE BAJA DE UN AVISO — useBajaNotificaciones.js
 * ============================================================
 * Lo que pasa al tocar "Dejar de recibirlos" en el pie de un correo.
 *
 * POR QUÉ SE APLICA SOLO AL LLEGAR, SIN PREGUNTAR NADA
 * Porque la persona ya lo pidió: hizo clic en un enlace que dice exactamente
 * eso. Ponerle un "¿está seguro?" delante es cobrarle un peaje por irse, y
 * quien se topa con un peaje no vuelve atrás — marca el correo como spam, que
 * le cuesta a la tienda muchísimo más caro que perder un suscriptor.
 *
 * Lo que sí se ofrece, DESPUÉS de haberlo hecho, es volver a encenderlo: si
 * alguien llegó por error, deshacerlo le cuesta un clic.
 *
 * El token viene en la URL —es la única forma, el correo no puede mandar un
 * cuerpo— pero no identifica a nadie a simple vista: va firmado y solo el
 * servidor sabe leerlo. Ver backend/utils/tokenBaja.js.
 * ============================================================
 */

const NOMBRES = {
  promociones: 'las promociones',
  nuevosProductos: 'los productos nuevos',
  pedidoCerca: 'los avisos de su pedido',
};

export const useBajaNotificaciones = () => {
  const [params] = useSearchParams();
  const token = params.get('t');

  /*
   * "No hay token" se sabe en el primer render, así que el estado nace ya
   * resuelto en vez de arrancar en "aplicando" y corregirse dentro del efecto.
   * Además de ahorrarse un render de más, evita el parpadeo de un "un momento,
   * estamos apagando esos correos" para algo que nunca se va a intentar.
   */
  const SIN_TOKEN = 'Este enlace está incompleto. Puede apagar los avisos desde Mi Cuenta › Notificaciones.';

  const [estado, setEstado] = useState(token ? 'aplicando' : 'error'); // aplicando | listo | error
  const [mensaje, setMensaje] = useState(token ? '' : SIN_TOKEN);
  const [clave, setClave] = useState(null);

  /*
   * En StrictMode el efecto corre dos veces en desarrollo, y esto escribe en la
   * base. La segunda llamada no rompe nada —apagar algo ya apagado da lo
   * mismo— pero ensucia los registros del servidor con una baja duplicada por
   * cada visita. Un candado y se acabó.
   */
  const yaSeAplico = useRef(false);

  useEffect(() => {
    // Sin token no hay nada que pedirle al servidor; el estado ya nació en error.
    if (!token || yaSeAplico.current) return;
    yaSeAplico.current = true;

    clientService
      .bajaNotificacion(token)
      .then((res) => {
        setClave(res?.clave || null);
        setEstado('listo');
      })
      .catch((error) => {
        setEstado('error');
        setMensaje(error?.message || 'No se pudo aplicar. Intente desde Mi Cuenta › Notificaciones.');
      });
  }, [token]);

  return {
    estado,
    mensaje,
    // "las promociones", para poder decir de qué exactamente se dio de baja en
    // vez de un "listo" que no aclara qué se apagó.
    queSeApago: NOMBRES[clave] || 'esos correos',
  };
};
