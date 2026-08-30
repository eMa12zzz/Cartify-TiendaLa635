import { useState } from 'react';
import styled from 'styled-components';
import { useAjustesCtx } from '../../context/AjustesContext';

/*
 * ============================================================
 * LA MARCA DE LA TIENDA — MarcaTienda.jsx
 * ============================================================
 * El nombre (o el logo) de la tienda, UNA sola vez para toda la aplicación.
 *
 * EL PROBLEMA QUE RESUELVE
 * Cada barra superior se dibujaba su propia versión de la marca, y ninguna
 * coincidía con las otras:
 *
 *   - El menú de la tienda: logo si lo hay, si no el nombre en dos líneas
 *     a 19px.
 *   - Mi Cuenta: dos líneas a 16px, y nunca el logo.
 *   - El checkout y la confirmación: "Tienda" en gris a 11px encima de
 *     "la 635" a 18px, centrado. Ni parecido.
 *   - El login de clientes: dos líneas a 17px.
 *   - El login del panel y la pantalla de bienvenida: el nombre ESCRITO A
 *     MANO en el código.
 *
 * Los dos últimos son el problema de verdad: si el dueño le cambia el nombre
 * a su tienda en Personalización, esas dos pantallas se quedan con el viejo y
 * lo desmienten. Y ninguna de las otras enseñaba el logo, así que subir uno
 * lo hacía aparecer en el menú y en ningún lado más.
 *
 * Ahora todas piden la marca aquí. Cambiar cómo se ve la tienda es cambiar
 * este archivo, y cambia en todas partes a la vez.
 * ============================================================
 */

const Envoltura = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.05;
`;

/*
 * El botón existe solo cuando la marca lleva a algún lado. Se declara aparte
 * para no meterle apariencia de botón a un texto que no se puede tocar.
 */
const Boton = styled.button`
  background: none;
  border: none;
  font-family: inherit;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.05;
  transition: background-color var(--dur-press) var(--ease-out);

  &:hover { background-color: rgba(0, 0, 0, 0.04); }
`;

const Linea = styled.span`
  display: block;
  font-size: ${(p) => p.$tamano}px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: ${(p) => p.$color};

  /* Igual que el menú: en pantallas chicas la marca cede sitio a lo demás. */
  @media (max-width: 700px) { font-size: ${(p) => p.$tamano * 0.82}px; }
`;

const Logo = styled.img`
  height: ${(p) => p.$alto}px;
  width: auto;
  max-width: 168px;
  object-fit: contain;
  display: block;

  @media (max-width: 700px) {
    height: ${(p) => p.$alto * 0.82}px;
    max-width: 124px;
  }
`;

/*
 * @param tamano - tamaño de letra del nombre, en px. El del menú es 19.
 * @param alto   - alto del logo, en px. El del menú es 38.
 * @param color  - color del texto; por defecto la tinta de la tienda.
 * @param onClick - si se pasa, la marca se vuelve un botón (volver al inicio).
 */
const MarcaTienda = ({ tamano = 19, alto = 38, color = 'var(--tinta, #111)', onClick, titulo }) => {
  const { ajustes } = useAjustesCtx();
  /*
   * Si la imagen no carga —Cloudinary caído, el archivo borrado— se cae al
   * nombre escrito. Sin esto la tienda se quedaba sin nombre en ningún lado.
   */
  const [logoFallo, setLogoFallo] = useState(false);

  const nombreCompleto = `${ajustes.nombreLinea1 || ''} ${ajustes.nombreLinea2 || ''}`.trim();

  const contenido = ajustes.logoUrl && !logoFallo ? (
    <Logo
      src={ajustes.logoUrl}
      /* El alt lleva el nombre escrito para que quien usa lector de pantalla
         oiga la tienda y no "imagen". */
      alt={nombreCompleto}
      $alto={alto}
      onError={() => setLogoFallo(true)}
    />
  ) : (
    <>
      <Linea $tamano={tamano} $color={color}>{ajustes.nombreLinea1}</Linea>
      {ajustes.nombreLinea2 && (
        <Linea $tamano={tamano} $color={color}>{ajustes.nombreLinea2}</Linea>
      )}
    </>
  );

  if (onClick) {
    return (
      <Boton type="button" onClick={onClick} title={titulo || nombreCompleto} aria-label={nombreCompleto}>
        {contenido}
      </Boton>
    );
  }

  return <Envoltura aria-label={nombreCompleto}>{contenido}</Envoltura>;
};

export default MarcaTienda;
