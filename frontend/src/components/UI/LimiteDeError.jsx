import { Component } from 'react';
import styled from 'styled-components';
import { AlertTriangle, RotateCcw, Store } from 'lucide-react';

/*
 * ============================================================
 * LÍMITE DE ERROR — LimiteDeError.jsx
 * ============================================================
 * La red debajo del trapecio.
 *
 * Cuando algo revienta durante el dibujado, React no deja la pantalla a
 * medias: desmonta TODO el árbol. El resultado es una página blanca absoluta
 * —ni encabezado, ni aviso, ni salida— y quien la ve no tiene forma de saber
 * si se cayó la tienda, si se le fue el internet o si hizo algo mal.
 *
 * Esto no arregla el error: lo contiene. Una falla al abrir un modal deja de
 * costar la sesión entera; se dice qué pasó y se ofrece una salida.
 *
 * Va como CLASE y no como hook a propósito: componentDidCatch es lo único de
 * React que todavía no tiene equivalente en hooks. No es una excepción a la
 * regla de la casa, es la única forma que hay.
 *
 * El detalle técnico solo se muestra en desarrollo. Al cliente no se le
 * enseña un stack trace: no le dice nada y lo asusta.
 * ============================================================
 */

const Pantalla = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #FBF6F0;
`;

const Tarjeta = styled.div`
  width: 100%;
  max-width: 520px;
  background: #fff;
  border: 1px solid #EDE7E0;
  border-radius: 20px;
  padding: 32px 28px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(90,55,25,0.08), 0 12px 28px rgba(90,55,25,0.10);
`;

const Icono = styled.div`
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #F3E7D8;
  color: #B46C30;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Titulo = styled.h1`
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
  color: #2A1A0E;
`;

const Texto = styled.p`
  margin: 0 0 22px;
  font-size: 14px;
  line-height: 1.55;
  color: #6B6560;
`;

const Botones = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Boton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out);

  border: ${(p) => (p.$primario ? 'none' : '1.5px solid #B46C30')};
  background: ${(p) => (p.$primario ? '#B46C30' : '#fff')};
  color: ${(p) => (p.$primario ? '#fff' : '#B46C30')};

  &:active { transform: scale(0.97); }

  @media (prefers-reduced-motion: reduce) {
    &:active { transform: none; }
  }
`;

/* Solo en desarrollo: el mensaje crudo, para no tener que abrir la consola. */
const Detalle = styled.pre`
  margin: 22px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #2A1A0E;
  color: #FFD9CF;
  font-size: 11.5px;
  line-height: 1.5;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow: auto;
`;

class LimiteDeError extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Queda en la consola con el árbol de componentes: es lo que de verdad
    // sirve para encontrar el archivo culpable.
    console.error('Error de render contenido por LimiteDeError:', error, info?.componentStack);
  }

  /*
   * Recargar y no un setState: si el árbol se cayó a la mitad, el estado que
   * quedó vivo alrededor ya no es de fiar. Volver a arrancar limpio es más
   * honesto que fingir que no pasó nada.
   */
  recargar = () => window.location.reload();

  irALaTienda = () => { window.location.href = '/store'; };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Pantalla role="alert">
        <Tarjeta>
          <Icono><AlertTriangle size={26} strokeWidth={1.9} /></Icono>
          <Titulo>Algo se nos rompió acá</Titulo>
          <Texto>
            No fue culpa suya. Esta pantalla no cargó bien; ya quedó anotado.
            Puede volver a intentarlo o regresar a la tienda.
          </Texto>
          <Botones>
            <Boton type="button" $primario onClick={this.recargar}>
              <RotateCcw size={15} strokeWidth={2.2} /> Volver a intentar
            </Boton>
            <Boton type="button" onClick={this.irALaTienda}>
              <Store size={15} strokeWidth={2.2} /> Ir a la tienda
            </Boton>
          </Botones>

          {import.meta.env.DEV && (
            <Detalle>{error?.stack || String(error)}</Detalle>
          )}
        </Tarjeta>
      </Pantalla>
    );
  }
}

export default LimiteDeError;
