import styled, { keyframes, css } from 'styled-components';
import {
  UploadCloud, X, File as Archivo, FileText, FileSpreadsheet,
  FileArchive, FileVideo, FileAudio, FileCode,
} from 'lucide-react';
import { useSubidaArchivo } from '../../hooks/useSubidaArchivo';

/*
 * SubidorArchivo — la misma zona de subida para toda la app.
 *
 * Antes había seis <input type="file"> con seis destinos distintos: tres con
 * su propia preview (parecidas pero cada una a su manera) y dos sin ninguna.
 * Esta pieza sustituye a todas: muestra de verdad lo que se eligió — la foto,
 * el PDF completo, o al menos el icono, el nombre y el peso.
 *
 * Está hecha con styled-components a propósito: tiene que verse bien tanto en
 * las pantallas de Tailwind (los modales del admin) como en las que ya usan
 * styled-components (Registro, Impresiones). Los estilos viajan con el
 * componente y no dependen de qué sistema use la pantalla que lo monta; lo que
 * cambia de un lugar a otro va por props, no clavado adentro.
 */

/* Nada aparece de la nada: arranca casi a tamaño y crece lo justo. */
const entrada = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: none; }
`;

const fundido = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

/*
 * Tres paletas:
 *   - claro:  el resto de la app (Registro, Impresiones, de cara al cliente).
 *   - oscuro: el panel izquierdo café oscuro de EmployeeFormModal, fijo a
 *             propósito — es un diseño propio del modal, no debe cambiar con
 *             la paleta de accesibilidad que el admin tenga elegida.
 *   - panel:  pantallas DENTRO del panel de administración (Personalización,
 *             el formulario de producto, el de promociones). Sigue las
 *             variables --theme-* de ThemeContext.jsx, así que se ve igual
 *             de oscura/clara/alto-contraste que el resto de esa pantalla.
 *
 * En claro y panel, el "vivo" (borde y fondo al pasar el mouse, arrastrar o
 * enfocar) usa var(--theme-primary) con el café de fábrica como respaldo —
 * no un hex clavado. --theme-primary lo pinta ThemeContext.jsx según la
 * paleta que el admin tenga elegida en SU navegador (incluida "Mi marca");
 * para cualquier otra persona que nunca tocó el selector, esa variable cae
 * sola al mismo color de marca que ya usa el resto de la tienda, así que no
 * cambia nada de cara al cliente.
 */
const PALETAS = {
  claro: {
    borde: '#d8d8d8',
    bordeVivo: 'var(--theme-primary, #B46C30)',
    fondo: '#fafafa',
    fondoVivo: 'var(--theme-primary-light, #F3E7D8)',
    texto: '#6B6560',
    textoFuerte: '#1C1614',
    lienzo: '#ffffff',
    chip: 'rgba(28, 22, 20, 0.55)',
  },
  oscuro: {
    borde: 'rgba(255, 255, 255, 0.4)',
    bordeVivo: '#ffffff',
    fondo: 'rgba(255, 255, 255, 0.05)',
    fondoVivo: 'rgba(255, 255, 255, 0.14)',
    texto: 'rgba(255, 255, 255, 0.9)',
    textoFuerte: '#ffffff',
    lienzo: 'rgba(255, 255, 255, 0.08)',
    chip: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    borde: 'var(--theme-card-border, #d8d8d8)',
    bordeVivo: 'var(--theme-primary, #B46C30)',
    fondo: 'var(--theme-card-bg, #fafafa)',
    fondoVivo: 'var(--theme-primary-light, #F3E7D8)',
    texto: 'var(--theme-text-secondary, #6B6560)',
    textoFuerte: 'var(--theme-text-primary, #1C1614)',
    lienzo: 'var(--theme-card-bg, #ffffff)',
    chip: 'rgba(0, 0, 0, 0.45)',
  },
};

/*
 * Con `crecer`, el subidor deja de medir un alto fijo y se estira para ocupar
 * lo que le sobre a su contenedor. Lo pide el formulario de producto: su panel
 * izquierdo se estira para igualar el alto del formulario de la derecha, y con
 * la imagen a 192px clavados quedaba media columna de fondo vacío debajo del
 * precio. La foto es lo único de ese panel que gana algo con más espacio.
 *
 * Va por prop y apagado por defecto: las otras cinco pantallas que usan esta
 * pieza siguen con su alto fijo, sin enterarse.
 */
const Envoltorio = styled.div`
  width: 100%;
  min-width: 0;
  ${(p) => p.$crecer && `
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  `}
`;

const Zona = styled.div`
  position: relative;
  width: 100%;
  ${(p) => (p.$crecer
    ? `flex: 1; min-height: ${p.$alto}px;`
    : `height: ${p.$alto}px;`)}
  border-radius: ${(p) => p.$radio}px;
  border: 2px dashed ${(p) => (p.$arrastrando ? p.$c.bordeVivo : p.$c.borde)};
  background: ${(p) => (p.$arrastrando ? p.$c.fondoVivo : p.$c.fondo)};
  color: ${(p) => p.$c.texto};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  text-align: center;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  transition: border-color var(--dur-press) var(--ease-out),
              background-color var(--dur-press) var(--ease-out),
              transform var(--dur-press) var(--ease-out),
              box-shadow var(--dur-press) var(--ease-out);

  /* Hover solo donde hay mouse de verdad: en el kiosco táctil se queda pegado. */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: ${(p) => p.$c.bordeVivo};
      background: ${(p) => p.$c.fondoVivo};
    }
  }

  /* Que se sienta que responde al dedo. */
  &:active { transform: scale(0.97); }

  &:focus-visible {
    border-color: ${(p) => p.$c.bordeVivo};
    /* Mismo truco que el aro de foco del buscador (HeaderTienda.jsx): el
       color base ya es una variable, así que "pegarle" una opacidad fija en
       hex no sirve — con color-mix el aro sigue siendo del mismo color que
       el borde, aunque ese color cambie con la paleta. */
    box-shadow: 0 0 0 3px color-mix(in srgb, ${(p) => p.$c.bordeVivo} 30%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    &:active { transform: none; }
  }
`;

/*
 * La preview entra encima de la zona. El !important del modo "menos
 * movimiento" es a propósito: la regla global de index.css deja TODAS las
 * animaciones en 0.01ms, y aquí queremos conservar el fundido — es lo que
 * avisa que el archivo cambió sin mover nada de lugar.
 */
const Capa = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${entrada} var(--dur-modal) var(--ease-out) both;

  @media (prefers-reduced-motion: reduce) {
    animation: ${fundido} 140ms linear both !important;
  }
`;

const Miniatura = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: ${(p) => p.$ajuste};
  ${(p) => p.$ajuste === 'contain' && css`padding: 8px;`}
`;

/*
 * El PDF de verdad, renderizado por el propio navegador: no hace falta ninguna
 * librería para esto. Sin pointer-events el visor se traga la rueda del mouse
 * y la página deja de bajar; apagados, además, un clic encima abre el selector
 * para cambiar el archivo, que es lo que uno espera al tocar la preview.
 */
const VistaPdf = styled('embed')`
  width: 100%;
  height: 100%;
  border: 0;
  background: ${(p) => p.$fondo};
  pointer-events: none;
`;

const Generico = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  width: 100%;
  color: ${(p) => p.$c.textoFuerte};
`;

const Extension = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.7;
`;

const TextoVacio = styled.p`
  margin: 0;
  font-size: 12.5px;
  line-height: 1.35;
  max-width: 90%;
`;

const BotonQuitar = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: ${(p) => p.$c.chip};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  transition: transform var(--dur-press) var(--ease-out),
              background-color var(--dur-press) var(--ease-out);

  @media (hover: hover) and (pointer: fine) {
    &:hover { background: #D8542C; }
  }
  &:active { transform: scale(0.9); }

  @media (prefers-reduced-motion: reduce) {
    &:active { transform: none; }
  }
`;

const Pie = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 7px;
  font-size: 12px;
  color: ${(p) => p.$c.texto};
  min-width: 0;
`;

const NombreArchivo = styled.span`
  font-weight: 600;
  color: ${(p) => p.$c.textoFuerte};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const Peso = styled.span`
  flex-shrink: 0;
  opacity: 0.8;
`;

const Aviso = styled.p`
  margin: 7px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: ${(p) => (p.$variante === 'oscuro' ? '#FFD9CF' : '#D8542C')};
  animation: ${fundido} var(--dur-popover) var(--ease-out) both;
`;

/* Icono según la extensión, para cuando no hay nada que dibujar. */
const ICONOS = {
  doc: FileText, docx: FileText, txt: FileText, rtf: FileText, odt: FileText,
  xls: FileSpreadsheet, xlsx: FileSpreadsheet, csv: FileSpreadsheet, ods: FileSpreadsheet,
  zip: FileArchive, rar: FileArchive, '7z': FileArchive, tar: FileArchive, gz: FileArchive,
  mp4: FileVideo, mov: FileVideo, avi: FileVideo, mkv: FileVideo, webm: FileVideo,
  mp3: FileAudio, wav: FileAudio, ogg: FileAudio, m4a: FileAudio,
  js: FileCode, json: FileCode, html: FileCode, css: FileCode, xml: FileCode,
};

const SubidorArchivo = ({
  accept = 'image/*',
  maxMB = 8,
  valorInicial = null,
  onArchivo,                 // (file, url) — url es la misma que se está viendo
  reinicio,
  ajuste = 'contain',        // 'contain' para producto, 'cover' para foto de perfil
  variante = 'claro',        // 'oscuro' para el panel café de los modales, 'panel' dentro del admin
  alto = 180,                // alto de la zona vacía
  altoPreview,               // alto cuando ya hay algo (por defecto, el mismo)
  crecer = false,            // ocupar el alto que sobre en vez de medir fijo
  radio = 14,
  titulo = 'Arrastra el archivo o haz clic para elegirlo',
  ayuda = '',
  etiquetaAria = 'Subir archivo',
  className = '',
}) => {
  const {
    url, tipo, nombre, peso, extension, hayAlgo, error, arrastrando,
    inputRef, quitar, abrirSelector, alTeclado, alCambiarInput,
    alArrastrarEncima, alSalirArrastre, alSoltar,
  } = useSubidaArchivo({ valorInicial, accept, maxMB, alElegir: onArchivo, reinicio });

  const c = PALETAS[variante] || PALETAS.claro;
  const IconoGenerico = ICONOS[extension] || Archivo;

  return (
    <Envoltorio className={className} $crecer={crecer}>
      <Zona
        $c={c}
        $crecer={crecer}
        $alto={hayAlgo ? (altoPreview ?? alto) : alto}
        $radio={radio}
        $arrastrando={arrastrando}
        role="button"
        tabIndex={0}
        aria-label={hayAlgo ? `${etiquetaAria}. Hay uno elegido: ${nombre}. Se puede cambiar` : etiquetaAria}
        onClick={abrirSelector}
        onKeyDown={alTeclado}
        onDragOver={alArrastrarEncima}
        onDragLeave={alSalirArrastre}
        onDrop={alSoltar}
      >
        {hayAlgo ? (
          <>
            {/*
              La key hace que la animación de entrada se vuelva a disparar al
              cambiar de archivo; sin ella React reusa el nodo y el cambio pasa
              sin que nadie lo note.
            */}
            <Capa key={url}>
              {tipo === 'imagen' && (
                <Miniatura src={url} alt={`Vista previa de ${nombre}`} $ajuste={ajuste} />
              )}

              {tipo === 'pdf' && (
                // Los parámetros del "#" le piden al visor del navegador que se
                // muestre limpio y a lo ancho: aquí se mira, no se navega.
                <VistaPdf
                  src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  type="application/pdf"
                  $fondo={c.lienzo}
                />
              )}

              {tipo === 'otro' && (
                <Generico $c={c}>
                  <IconoGenerico size={30} strokeWidth={1.6} />
                  {extension && <Extension>{extension}</Extension>}
                </Generico>
              )}
            </Capa>

            <BotonQuitar
              type="button"
              $c={c}
              aria-label={`Quitar ${nombre}`}
              title="Quitar"
              onClick={(e) => { e.stopPropagation(); quitar(); }}
              // Sin esto, el Enter del botón sube y también abre el selector.
              onKeyDown={(e) => e.stopPropagation()}
            >
              <X size={15} />
            </BotonQuitar>
          </>
        ) : (
          <>
            <UploadCloud size={26} strokeWidth={1.7} />
            <TextoVacio>{titulo}</TextoVacio>
            {ayuda && <TextoVacio style={{ opacity: 0.7, fontSize: 11.5 }}>{ayuda}</TextoVacio>}
          </>
        )}

        {/*
          El input de verdad, escondido pero vivo: es quien abre el selector del
          sistema. Fuera del tabulador porque la zona de arriba ya es el botón
          accesible y no queremos dos paradas para lo mismo.
        */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={alCambiarInput}
          tabIndex={-1}
          aria-hidden="true"
          style={{ display: 'none' }}
        />
      </Zona>

      {hayAlgo && (
        <Pie $c={c}>
          {/*
            El $c va SIEMPRE, aunque el padre ya lo tenga: styled-components no
            hereda props. Sin él, la regla de color leía una paleta inexistente
            y reventaba el render entero en cuanto alguien elegía un archivo —
            que es exactamente cuando esta línea aparece por primera vez.
          */}
          <NombreArchivo $c={c} title={nombre}>{nombre}</NombreArchivo>
          {peso && <Peso>{peso}</Peso>}
        </Pie>
      )}

      {error && <Aviso role="alert" $variante={variante}>{error}</Aviso>}
    </Envoltorio>
  );
};

export default SubidorArchivo;
