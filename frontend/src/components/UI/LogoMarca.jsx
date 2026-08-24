import { Tag } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAjustesCtx } from '../../context/AjustesContext';

/*
 * LogoMarca — el sello de la tienda: una placa con el tag y el nombre
 * DENTRO de la misma pieza. El fondo usa var(--theme-primary) en vez de un
 * café quemado en una imagen, así que cambia solo según la paleta que el
 * admin tenga activa (incluida "Mi marca", que sigue el color configurado
 * en Personalización).
 *
 * Primer intento: un cuadrado rotado 45° detrás del texto, como en el
 * boceto. Centrado, salían los 4 picos parejos —una flor, no un tag— y el
 * texto quedaba montado encima de un pico. Una placa horizontal con el tag
 * y el nombre uno al lado del otro es más robusta: no hay geometría que se
 * pueda romper en ningún tamaño.
 *
 * El texto usa buttonText de la paleta activa, no blanco fijo: en Alto
 * Contraste el fondo es amarillo y buttonText es negro — blanco ahí
 * desaparecería.
 */
const LogoMarca = ({ height = 44 }) => {
  const { palette } = useTheme();
  const { ajustes } = useAjustesCtx();
  const textoSobreColor = palette.colors.buttonText;

  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl px-3 flex-none"
      style={{ height, backgroundColor: 'var(--theme-primary)' }}
    >
      <Tag className="flex-none" style={{ width: height * 0.42, height: height * 0.42, color: textoSobreColor }} strokeWidth={2.5} />
      <span className="font-extrabold leading-none" style={{ fontSize: height * 0.26, color: textoSobreColor }}>
        {ajustes.nombreLinea1}
        {ajustes.nombreLinea2 && <><br />{ajustes.nombreLinea2}</>}
      </span>
    </div>
  );
};

export default LogoMarca;
