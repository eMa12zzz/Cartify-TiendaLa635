import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Store as StoreIcon } from 'lucide-react';
import MarcaTienda from './MarcaTienda';

/*
 * ============================================================
 * ENCABEZADO DE LAS PANTALLAS DE ACCESO — EncabezadoAcceso.jsx
 * ============================================================
 * La barra de arriba del login, el registro, la verificación y las
 * contraseñas: SOLO el nombre y la salida a la tienda.
 *
 * No es el HeaderTienda completo a propósito —aquí no hacen falta el buscador
 * ni los pasillos— pero se viste igual que él: mismo alto de 64px, misma línea
 * de abajo y el mismo relleno lateral, para que pasar de la tienda al login no
 * se sienta como cambiar de sitio.
 *
 * Vivía dentro de LoginClient, y el resto de pantallas de acceso se había
 * quedado con la barra vieja: "Tienda / la 635" escrito a mano y centrado,
 * sin logo y sin salida. Entrar por el login y seguir al registro era pasar
 * de una tienda a otra. Ahora es una sola pieza para todas.
 *
 * El nombre sale de los ajustes (MarcaTienda): si el dueño le cambia el nombre
 * al negocio, la primera pantalla que ve quien va a entregar su correo no
 * sigue diciendo el viejo.
 * ============================================================
 */

const Barra = styled.header`
  background: var(--papel);
  border-bottom: 1px solid var(--linea);
  padding: 0 28px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 700px) { padding: 0 16px; }
`;

/* La misma pastilla que los botones del encabezado de la tienda. */
const VolverTienda = styled.button`
  background: var(--papel);
  border: 1px solid var(--linea);
  color: var(--tinta-suave);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 16px;
  height: 44px;
  border-radius: var(--radio-pill);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: border-color var(--dur-press) var(--ease-out),
              color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { color: var(--marca-600); }
  }
  &:active { transform: scale(0.97); }
`;

const EncabezadoAcceso = () => {
  const navigate = useNavigate();

  return (
    <Barra>
      <MarcaTienda tamano={19} alto={38} onClick={() => navigate('/')} titulo="Ir a la tienda" />
      <VolverTienda type="button" onClick={() => navigate('/')}>
        <StoreIcon size={16} strokeWidth={2.2} /> Seguir viendo la tienda
      </VolverTienda>
    </Barra>
  );
};

export default EncabezadoAcceso;
