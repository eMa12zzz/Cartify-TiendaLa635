import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/*
 * CampoContrasena — input de contraseña con el ojo para verla.
 *
 * Escribir a ciegas una contraseña con mayúsculas y símbolos, en un teclado
 * de celular, es la razón número uno de "no me deja entrar". Poder mirarla un
 * segundo resuelve más problemas de acceso que cualquier mensaje de error.
 *
 * Se comporta como un <input> normal: acepta las mismas props y funciona con
 * react-hook-form (por eso el forwardRef, para que register() alcance al input
 * de adentro y no se pierda en este envoltorio).
 */
/*
 * Solo el ojo, para las pantallas que arman su input con styled-components y
 * ya tienen su propio envoltorio posicionado. Estilos en línea a propósito:
 * así funciona igual dentro de Tailwind que dentro de styled-components.
 */
export const BotonOjo = ({ visible, onToggle, derecha = 14 }) => (
  <button
    type="button"
    onClick={onToggle}
    tabIndex={-1}
    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    style={{
      position: 'absolute',
      right: derecha,
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      color: '#9ca3af',
      zIndex: 2,
    }}
  >
    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
  </button>
);

const CampoContrasena = forwardRef(({ className = '', ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        // Espacio a la derecha para que el texto no pase por debajo del ojo.
        className={`${className} pr-11`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        /*
         * Fuera del recorrido del tabulador: quien navega con teclado va del
         * campo al botón de entrar, no a un interruptor visual.
         */
        tabIndex={-1}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
});

CampoContrasena.displayName = 'CampoContrasena';

export default CampoContrasena;
