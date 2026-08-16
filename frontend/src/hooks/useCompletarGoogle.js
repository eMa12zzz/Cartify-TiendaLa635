import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { googleLoginDB } from '../api/authApi';
import { useAuth } from './useAuth';
import { marcarRecienRegistrado } from '../utils/primerIngreso';

/*
 * ============================================================
 * TERMINAR DE ENTRAR CON GOOGLE — useCompletarGoogle.js
 * ============================================================
 * Google confirma QUIÉN es la persona. No confirma que haya aceptado nada, ni
 * sabe su teléfono, ni su edad. Este hook cubre ese hueco.
 *
 * POR QUÉ HAY UNA PANTALLA EN MEDIO
 * Antes, entrar con Google con un correo sin cuenta mandaba a /register en
 * blanco: la persona acababa de darle permiso a la tienda para leer su nombre
 * y su correo, y lo primero que se encontraba era un formulario vacío
 * pidiéndoselos otra vez. La mitad se cae ahí, y con razón.
 *
 * Ahora se le pide SOLO lo que Google no da —teléfono, fecha de nacimiento,
 * documento— y las dos decisiones que solo puede tomar ella: si acepta los
 * términos y si quiere promociones.
 *
 * EL TOKEN NO SE GUARDA EN NINGÚN LADO
 * Viaja en el estado de la navegación (react-router), no en la URL ni en
 * localStorage. Un token de Google en la barra de direcciones queda en el
 * historial, en los registros del servidor y en cualquier captura de pantalla.
 * Si alguien llega a esta pantalla sin token —recargando, o pegando la
 * dirección— no hay nada que completar y se le devuelve al login.
 * ============================================================
 */

export const useCompletarGoogle = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const [cargando, setCargando] = useState(false);

  // Lo que Google ya confirmó: nombre, correo y foto. Se muestra, no se pide.
  const sugerido = state?.sugerido || {};
  const credential = state?.credential || null;
  const volverA = state?.volverA || '/';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: { phoneNumber: '', fechaNacimiento: '', dui: '', aceptaTerminos: false, promociones: false },
  });

  const enviar = async (datos) => {
    if (!credential) {
      toast.error('La sesión de Google venció. Vuelva a intentarlo.');
      navigate('/iniciar-sesion');
      return;
    }

    try {
      setCargando(true);
      /*
       * Es la MISMA llamada del login, ahora con el consentimiento puesto. El
       * servidor vuelve a verificar el token contra Google —no confía en que
       * ya se validó una vez— y recién ahí crea la cuenta. Ver googleAuthClient.
       */
      const res = await googleLoginDB(credential, {
        aceptaTerminos: true,
        promociones: !!datos.promociones,
        phoneNumber: datos.phoneNumber,
        fechaNacimiento: datos.fechaNacimiento || undefined,
        dui: datos.dui || undefined,
      });

      login(res.token, res.userType || 'client', res.client);

      /*
       * Acaba de crear su cuenta, así que le toca el saludo con el mapa donde
       * deja su dirección — lo mismo que al registro normal. Sin esto, un
       * cliente nuevo de Google caía en la portada sin ninguna dirección
       * guardada y descubría que le falta recién al ir a pagar.
       * Ver utils/primerIngreso.js.
       */
      marcarRecienRegistrado();
      toast.success('¡Listo! Su cuenta quedó creada.');

      /*
       * `replace` a propósito: esta pantalla ya cumplió. Sin él, el "atrás"
       * del navegador devuelve a un formulario cuyo token de Google ya se usó.
       */
      navigate('/bienvenida', { replace: true, state: { volverA } });
    } catch (error) {
      /*
       * El caso feo: el token de Google vence a la hora. Si alguien deja esta
       * pantalla abierta y vuelve mañana, el servidor lo rechaza — y decirle
       * "error 401" no le sirve de nada.
       */
      toast.error(error.message || 'No se pudo crear la cuenta. Vuelva a entrar con Google.');
    } finally {
      setCargando(false);
    }
  };

  return {
    // Sin token no hay nada que completar: la pantalla lo usa para devolverse.
    hayToken: !!credential,
    sugerido,
    register,
    errors,
    cargando,
    aceptoTerminos: !!watch('aceptaTerminos'),
    onSubmit: handleSubmit(enviar),
    cancelar: () => navigate('/iniciar-sesion', { replace: true }),
  };
};
