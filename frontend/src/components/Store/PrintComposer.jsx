import { useRef } from 'react';
import { ImagePlus, ZoomIn, ZoomOut, RotateCcw, RotateCw, Copy, Trash2, ArrowUp, Plus, X } from 'lucide-react';

/*
 * PrintComposer — el editor visual de la hoja de impresión.
 * Solo pinta: toda la lógica vive en usePrintComposer.
 *
 * La hoja respeta la proporción REAL del formato elegido (widthCm × heightCm),
 * así lo que el cliente ve es lo que se imprime. Botones grandes y toolbar
 * al seleccionar (nada de manijitas diminutas) para que sirva con el dedo.
 */
const BROWN = 'var(--marca-600)';

const PrintComposer = ({ composer }) => {
  const {
    paginas, paginaActiva, setPaginaActiva, seleccionado, setSeleccionado,
    agregarImagenes, mover, escalar, rotar, duplicar, eliminar, traerAlFrente,
    agregarPagina, eliminarPagina, widthCm, heightCm,
  } = composer;

  const hojaRef = useRef(null);
  const inputRef = useRef(null);
  const pagina = paginas[paginaActiva] || { items: [] };

  // Arrastrar con mouse o dedo (pointer events cubren ambos).
  const iniciarArrastre = (e, item) => {
    e.preventDefault();
    setSeleccionado(item.id);
    const rect = hojaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = item.x;
    const origY = item.y;

    const alMover = (ev) => {
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      mover(item.id, origX + dx, origY + dy);
    };
    const alSoltar = () => {
      window.removeEventListener('pointermove', alMover);
      window.removeEventListener('pointerup', alSoltar);
    };
    window.addEventListener('pointermove', alMover);
    window.addEventListener('pointerup', alSoltar);
  };

  const btn = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
    borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#333',
  };

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
          Hoja {widthCm} × {heightCm} cm — arrastra las imágenes para acomodarlas
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

      {/* La hoja */}
      <div
        ref={hojaRef}
        onPointerDown={(e) => { if (e.target === hojaRef.current) setSeleccionado(null); }}
        style={{
          position: 'relative', width: '100%', aspectRatio: `${widthCm} / ${heightCm}`,
          background: '#fff', border: '1px solid #ddd', borderRadius: 8,
          overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', touchAction: 'none',
          marginBottom: 12,
        }}
      >
        {pagina.items.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 14, pointerEvents: 'none' }}>
            Agrega imágenes y acomódalas aquí
          </div>
        )}

        {pagina.items.map((it) => (
          <img
            key={it.id}
            src={it.src}
            alt=""
            draggable={false}
            onPointerDown={(e) => iniciarArrastre(e, it)}
            style={{
              position: 'absolute',
              left: `${it.x * 100}%`,
              top: `${it.y * 100}%`,
              width: `${it.w * 100}%`,
              height: 'auto',
              transform: `translate(-50%, -50%) rotate(${it.rot || 0}deg)`,
              cursor: 'grab',
              outline: seleccionado === it.id ? `2px solid ${BROWN}` : 'none',
              userSelect: 'none',
            }}
          />
        ))}
      </div>

      {/* Toolbar de la imagen seleccionada */}
      {seleccionado && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <button type="button" style={btn} onClick={() => escalar(seleccionado, 1.15)}><ZoomIn size={16} /> Más grande</button>
          <button type="button" style={btn} onClick={() => escalar(seleccionado, 0.87)}><ZoomOut size={16} /> Más pequeña</button>
          <button type="button" style={btn} onClick={() => rotar(seleccionado, -15)}><RotateCcw size={16} /> Girar</button>
          <button type="button" style={btn} onClick={() => rotar(seleccionado, 15)}><RotateCw size={16} /> Girar</button>
          <button type="button" style={btn} onClick={() => duplicar(seleccionado)}><Copy size={16} /> Duplicar</button>
          <button type="button" style={btn} onClick={() => traerAlFrente(seleccionado)}><ArrowUp size={16} /> Al frente</button>
          <button type="button" style={{ ...btn, color: '#ef4444', borderColor: '#fecaca' }} onClick={() => eliminar(seleccionado)}>
            <Trash2 size={16} /> Quitar
          </button>
        </div>
      )}
      {!seleccionado && pagina.items.length > 0 && (
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>Toca una imagen para agrandarla, girarla o duplicarla.</p>
      )}
    </div>
  );
};

export default PrintComposer;
