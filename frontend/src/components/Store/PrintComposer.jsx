import { useRef } from 'react';
import { ImagePlus, Copy, Trash2, Plus, X, ImageOff } from 'lucide-react';
import { pxDesdeCm } from '../../utils/pxImpresion';

/*
 * PrintComposer — el editor visual de la hoja de impresión.
 * Solo pinta: toda la lógica vive en usePrintComposer.
 *
 * La hoja es una CUADRÍCULA de celdas del tamaño real del formato elegido
 * (columnas × filas calculadas en el hook). Cada foto llena su celda por
 * completo — no hay arrastre ni zoom: eso era lo que dejaba una foto chica
 * flotando en una hoja enorme. Se sube, cae en la siguiente celda vacía, y
 * listo.
 */
const BROWN = 'var(--marca-600)';

const PrintComposer = ({ composer }) => {
  const {
    paginas, paginaActiva, setPaginaActiva, seleccionado, setSeleccionado,
    agregarImagenes, eliminar, duplicar,
    agregarPagina, eliminarPagina, widthCm, heightCm,
    celdaAnchoCm, celdaAltoCm, columnas, filas,
  } = composer;

  const inputRef = useRef(null);
  const pagina = paginas[paginaActiva] || { celdas: [] };

  const btn = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
    borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#333',
  };

  const haySeleccion = seleccionado?.pagina === paginaActiva;
  const celdaSeleccionada = haySeleccion ? pagina.celdas[seleccionado.celda] : null;

  return (
    <div>
      {/* Acciones principales */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <button type="button" onClick={() => inputRef.current?.click()}
          style={{ ...btn, background: BROWN, color: '#fff', border: 'none', padding: '10px 16px' }}>
          <ImagePlus size={18} /> Agregar imágenes
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={(e) => { agregarImagenes(e.target.files); e.target.value = ''; }} />
        <span style={{ fontSize: 12, color: '#999', alignSelf: 'center' }}>
          Celda {pxDesdeCm(celdaAnchoCm)} × {pxDesdeCm(celdaAltoCm)} px — hoja {widthCm} × {heightCm} cm ({columnas * filas} por hoja)
        </span>
      </div>

      {/* Pestañas de páginas */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {paginas.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button type="button" onClick={() => { setPaginaActiva(i); setSeleccionado(null); }}
              style={{
                ...btn, padding: '6px 12px', fontSize: 12,
                background: i === paginaActiva ? 'var(--marca-100)' : '#fff',
                borderColor: i === paginaActiva ? BROWN : '#e0e0e0',
                color: i === paginaActiva ? BROWN : '#555',
              }}>
              Página {i + 1}
            </button>
            {paginas.length > 1 && (
              <button type="button" onClick={() => eliminarPagina(i)} title="Eliminar página"
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 4px' }}>
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={agregarPagina} style={{ ...btn, padding: '6px 12px', fontSize: 12 }}>
          <Plus size={14} /> Agregar página
        </button>
      </div>

      {/*
        La hoja, en cuadrícula. Las columnas y filas van en `fr` con el
        tamaño REAL de la celda (no 1fr parejo) — si no, una celda de 10×10
        en una hoja de 21.6×27.9 se estira pareja entre las columnas y filas
        que quepan, y una celda cuadrada sale rectangular. Lo que sobra de la
        hoja (columnas/filas no completas) se deja como una pista más, en
        blanco: el margen de una hoja de verdad.
      */}
      {(() => {
        const sobranteAncho = Math.max(0, widthCm - columnas * celdaAnchoCm);
        const sobranteAlto = Math.max(0, heightCm - filas * celdaAltoCm);
        const colsTemplate = `repeat(${columnas}, ${celdaAnchoCm}fr)` + (sobranteAncho > 0.05 ? ` ${sobranteAncho}fr` : '');
        const rowsTemplate = `repeat(${filas}, ${celdaAltoCm}fr)` + (sobranteAlto > 0.05 ? ` ${sobranteAlto}fr` : '');

        return (
          <div
            style={{
              width: '100%', aspectRatio: `${widthCm} / ${heightCm}`,
              background: '#fff', border: '1px solid #ddd', borderRadius: 8,
              overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              display: 'grid',
              gridTemplateColumns: colsTemplate,
              gridTemplateRows: rowsTemplate,
              marginBottom: 12,
            }}
          >
            {pagina.celdas.map((celda, i) => {
              const elegida = seleccionado?.pagina === paginaActiva && seleccionado?.celda === i;
              const col = i % columnas;
              const fil = Math.floor(i / columnas);
              return (
                <div
                  key={i}
                  onClick={() => setSeleccionado(celda ? { pagina: paginaActiva, celda: i } : null)}
                  style={{
                    position: 'relative',
                    gridColumn: col + 1,
                    gridRow: fil + 1,
                    borderRight: (col !== columnas - 1) ? '1px dashed #e5e5e5' : 'none',
                    borderBottom: (fil !== filas - 1) ? '1px dashed #e5e5e5' : 'none',
                    outline: elegida ? `2px solid ${BROWN}` : 'none',
                    outlineOffset: -2,
                    cursor: celda ? 'pointer' : 'default',
                    background: celda ? 'transparent' : '#fafafa',
                  }}
                >
                  {celda ? (
                    <img
                      src={celda.src}
                      alt=""
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                      <ImageOff size={18} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Toolbar de la celda seleccionada */}
      {celdaSeleccionada && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <button type="button" style={btn} onClick={() => duplicar(seleccionado.pagina, seleccionado.celda)}><Copy size={16} /> Duplicar</button>
          <button type="button" style={{ ...btn, color: '#ef4444', borderColor: '#fecaca' }} onClick={() => eliminar(seleccionado.pagina, seleccionado.celda)}>
            <Trash2 size={16} /> Quitar
          </button>
        </div>
      )}
      {!celdaSeleccionada && pagina.celdas.some(Boolean) && (
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>Toca una foto para duplicarla o quitarla.</p>
      )}
    </div>
  );
};

export default PrintComposer;
