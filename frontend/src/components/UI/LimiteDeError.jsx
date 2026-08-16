import { Component } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AlertTriangle, RotateCcw, Store } from 'lucide-react';
import { areaDeRuta } from '../../utils/sesion';

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

/*
 * DOS PALETAS, SEGÚN DÓNDE REVENTÓ.
 *
 * Este límite envuelve TODA la app, y ahí estaba el problema: pintaba siempre
 * con --theme-*, la paleta del PANEL. Con "Modo Oscuro" puesto, un error en la
 * TIENDA le mostraba al cliente una pantalla morada sobre fondo negro — los
 * colores de una herramienta de trabajo que él nunca ha visto, justo en el
 * momento en que más necesita reconocer dónde está parado.
 *
 * Ahora el color lo decide la ruta, igual que los avisos. Los hex de respaldo
 * se quedan para el caso extremo de que algo truene ANTES de que los
 * proveedores terminen de montar. Ver useEstiloAvisos.
 */
/*
 * Los dos colores que se usan más de una vez, en funciones y no repetidos en
 * cada regla: el principal (icono, botón sólido, borde del otro botón) y el
 * de la tarjeta.
 */
const colorPrincipal = (p) => (p.$panel ? 'var(--theme-primary, #003049)' : 'var(--marca-600, #003049)');
const colorTarjeta = (p) => (p.$panel ? 'var(--theme-card-bg, #fff)' : 'var(--papel, #fff)');

const Pantalla = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${(p) => (p.$panel ? "var(--theme-main-bg, #F1F6F9)" : "var(--marca-50, #F1F6F9)")};
`;

const Tarjeta = styled.div`
  width: 100%;
  max-width: 520px;
  background: ${(p) => (p.$panel ? "var(--theme-card-bg, #fff)" : "var(--papel, #fff)")};
  border: 1px solid ${(p) => (p.$panel ? "var(--theme-card-border, #ECE7E1)" : "var(--linea, #ECE7E1)")};
  border-radius: 20px;
  padding: 32px 28px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,48,73,0.08), 0 12px 28px rgba(0,48,73,0.10);
`;

const Icono = styled.div`
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: ${(p) => (p.$panel ? "var(--theme-primary-light, #DDECF3)" : "var(--marca-100, #DDECF3)")};
  color: ${(p) => (p.$panel ? "var(--theme-primary, #003049)" : "var(--marca-600, #003049)")};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Titulo = styled.h1`
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
  color: ${(p) => (p.$panel ? "var(--theme-text-primary, #1C1614)" : "var(--tinta, #1C1614)")};
`;

const Texto = styled.p`
  margin: 0 0 22px;
  font-size: 14px;
  line-height: 1.55;
  color: ${(p) => (p.$panel ? "var(--theme-text-secondary, #6B6560)" : "var(--tinta-suave, #6B6560)")};
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

  /* Dos decisiones en una: de qué paleta sale el color, y si el botón es el
     sólido o el de borde. Se resuelven juntas para no anidar interpolaciones. */
  border: ${(p) => (p.$primario ? 'none' : `1.5px solid ${colorPrincipal(p)}`)};
  background: ${(p) => (p.$primario ? colorPrincipal(p) : colorTarjeta(p))};
  color: ${(p) => (p.$primario ? '#fff' : colorPrincipal(p))};

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
  background: #1C1614;
  color: #F2C9C0;
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

  irALaTienda = () => { window.location.href = '/'; };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // Dónde reventó decide con qué paleta se pinta la disculpa.
    const panel = !!this.props.enPanel;

    return (
      <Pantalla role="alert" $panel={panel}>
        <Tarjeta $panel={panel}>
          <Icono $panel={panel}><AlertTriangle size={26} strokeWidth={1.9} /></Icono>
          <Titulo $panel={panel}>Algo se nos rompió acá</Titulo>
          <Texto $panel={panel}>
            No fue culpa suya. Esta pantalla no cargó bien; ya quedó anotado.
            Puede volver a intentarlo o regresar a la tienda.
          </Texto>
          <Botones>
            <Boton type="button" $primario $panel={panel} onClick={this.recargar}>
              <RotateCcw size={15} strokeWidth={2.2} /> Volver a intentar
            </Boton>
            <Boton type="button" $panel={panel} onClick={this.irALaTienda}>
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

/*
 * El envoltorio que le dice al límite dónde está parada la persona.
 *
 * Va aparte porque componentDidCatch solo existe en clases y las clases no
 * pueden usar hooks. Así el que se exporta sigue llamándose igual y App.jsx no
 * se entera del cambio.
 *
 * La frontera entre panel y tienda no se vuelve a escribir aquí: es la misma
 * de utils/sesion.js, la que decide también qué sesión manda en cada ruta y de
 * qué color salen los avisos. Una ruta nueva del panel se agrega ALLÁ.
 */
const LimiteDeErrorConArea = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <LimiteDeError enPanel={areaDeRuta(pathname) === 'personal'}>
      {children}
    </LimiteDeError>
  );
};

export default LimiteDeErrorConArea;
