import { useMemo } from 'react';
import { useTemaCalculado } from './useTemporada';
import { useAjustesCtx } from '../context/AjustesContext';
import { disfrazDeTema } from '../utils/disfracesTiqui';

/*
 * El disfraz que lleva Tiqui AQUÍ, en esta pantalla. Ver utils/disfracesTiqui.js.
 *
 * Sigue las mismas reglas que la decoración de la temporada, porque es parte
 * de ella:
 *   - Solo en el área del cliente. El panel es una herramienta de trabajo y
 *     no se repinta de temporada; tampoco se disfraza.
 *   - Si el dueño apagó la decoración (y dejó solo los colores), Tiqui va sin
 *     disfraz: pidió una temporada discreta, no un personaje con gorro.
 *
 * Si el dueño le armó un disfraz a la temporada en el panel, es ese.
 */
export const useDisfrazTiqui = () => {
  const { tema, activo, conDecoracion } = useTemaCalculado();
  const { ajustes } = useAjustesCtx();
  const disfraces = ajustes.temporada?.disfraces;
  return useMemo(
    () => (activo && conDecoracion ? disfrazDeTema(tema, disfraces) : null),
    [tema, activo, conDecoracion, disfraces]
  );
};
