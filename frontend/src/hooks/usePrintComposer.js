import { useState, useRef, useCallback } from 'react';

/*
 * usePrintComposer — el "cerebro" del editor de impresiones.
 *
 * El cliente arma su hoja: sube varias imágenes y las acomoda como quiera
 * dentro de la plantilla (el formato elegido define la proporción real).
 * Soporta VARIAS PÁGINAS.
 *
 * Al exportar:
 *   - 1 página  → una imagen PNG de la hoja.
 *   - 2 o más   → un PDF multipágina (jsPDF), con el tamaño real en cm.
 *
 * Coordenadas: se guardan en FRACCIONES de la hoja (0 a 1), donde x/y es el
 * CENTRO de la imagen y w su ancho. Así lo que se ve en pantalla y lo que se
 * dibuja en el canvas final coinciden exactamente, sin importar el zoom.
 */

const DPI = 300;             // calidad de impresión
const MAX_LADO_PX = 4000;    // tope para que un póster no reviente la memoria

// Carga una imagen y espera a que esté lista (para dibujarla en el canvas).
const cargarImagen = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const usePrintComposer = ({ widthCm = 21.6, heightCm = 27.9 } = {}) => {
  const [paginas, setPaginas] = useState([{ id: 1, items: [] }]);
  const [paginaActiva, setPaginaActiva] = useState(0);
  const [seleccionado, setSeleccionado] = useState(null);
  const idRef = useRef(100);
  const nuevoId = () => ++idRef.current;

  // Aplica un cambio a un item de la página activa.
  const editarItem = useCallback((itemId, cambios) => {
    setPaginas((prev) =>
      prev.map((pag, i) =>
        i !== paginaActiva
          ? pag
          : { ...pag, items: pag.items.map((it) => (it.id === itemId ? { ...it, ...cambios } : it)) }
      )
    );
  }, [paginaActiva]);

  // Agrega imágenes (varias a la vez) a la página activa, escalonadas.
  const agregarImagenes = useCallback((files) => {
    const lista = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (lista.length === 0) return;

    setPaginas((prev) =>
      prev.map((pag, i) => {
        if (i !== paginaActiva) return pag;
        const nuevos = lista.map((file, k) => {
          const n = pag.items.length + k;
          return {
            id: nuevoId(),
            src: URL.createObjectURL(file),
            // Escalonamos un poquito para que no queden una encima de otra.
            x: 0.5 + ((n % 3) - 1) * 0.12,
            y: 0.5 + (Math.floor(n / 3) % 3 - 1) * 0.12,
            w: 0.45,
            rot: 0,
          };
        });
        return { ...pag, items: [...pag.items, ...nuevos] };
      })
    );
  }, [paginaActiva]);

  // Mover (recibe la posición nueva en fracciones, la limitamos a la hoja).
  const mover = useCallback((itemId, x, y) => {
    const clamp = (v) => Math.min(1.1, Math.max(-0.1, v));
    editarItem(itemId, { x: clamp(x), y: clamp(y) });
  }, [editarItem]);

  const escalar = useCallback((itemId, factor) => {
    setPaginas((prev) =>
      prev.map((pag, i) =>
        i !== paginaActiva
          ? pag
          : {
              ...pag,
              items: pag.items.map((it) =>
                it.id === itemId ? { ...it, w: Math.min(2, Math.max(0.05, it.w * factor)) } : it
              ),
            }
      )
    );
  }, [paginaActiva]);

  const rotar = useCallback((itemId, grados) => {
    setPaginas((prev) =>
      prev.map((pag, i) =>
        i !== paginaActiva
          ? pag
          : { ...pag, items: pag.items.map((it) => (it.id === itemId ? { ...it, rot: (it.rot || 0) + grados } : it)) }
      )
    );
  }, [paginaActiva]);

  // Duplicar: útil para repetir la misma foto varias veces en la hoja (ej. DUI).
  const duplicar = useCallback((itemId) => {
    setPaginas((prev) =>
      prev.map((pag, i) => {
        if (i !== paginaActiva) return pag;
        const original = pag.items.find((it) => it.id === itemId);
        if (!original) return pag;
        return {
          ...pag,
          items: [...pag.items, { ...original, id: nuevoId(), x: Math.min(0.95, original.x + 0.08), y: Math.min(0.95, original.y + 0.08) }],
        };
      })
    );
  }, [paginaActiva]);

  const eliminar = useCallback((itemId) => {
    setPaginas((prev) =>
      prev.map((pag, i) => (i !== paginaActiva ? pag : { ...pag, items: pag.items.filter((it) => it.id !== itemId) }))
    );
    setSeleccionado(null);
  }, [paginaActiva]);

  // Traer al frente = mandarlo al final del arreglo (se dibuja encima).
  const traerAlFrente = useCallback((itemId) => {
    setPaginas((prev) =>
      prev.map((pag, i) => {
        if (i !== paginaActiva) return pag;
        const item = pag.items.find((it) => it.id === itemId);
        if (!item) return pag;
        return { ...pag, items: [...pag.items.filter((it) => it.id !== itemId), item] };
      })
    );
  }, [paginaActiva]);

  const agregarPagina = useCallback(() => {
    setPaginas((prev) => {
      const nueva = [...prev, { id: nuevoId(), items: [] }];
      setPaginaActiva(nueva.length - 1);
      return nueva;
    });
    setSeleccionado(null);
  }, []);

  const eliminarPagina = useCallback((indice) => {
    setPaginas((prev) => {
      if (prev.length === 1) return prev; // siempre queda al menos una
      const nuevas = prev.filter((_, i) => i !== indice);
      setPaginaActiva((act) => Math.max(0, Math.min(act, nuevas.length - 1)));
      return nuevas;
    });
    setSeleccionado(null);
  }, []);

  // Dibuja una página completa en un canvas a resolución de impresión.
  const renderPagina = async (pagina) => {
    const pxPorCm = DPI / 2.54;
    let W = Math.round(widthCm * pxPorCm);
    let H = Math.round(heightCm * pxPorCm);

    // Si la hoja es enorme (pósters), bajamos proporcionalmente.
    const mayor = Math.max(W, H);
    if (mayor > MAX_LADO_PX) {
      const f = MAX_LADO_PX / mayor;
      W = Math.round(W * f);
      H = Math.round(H * f);
    }

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    for (const it of pagina.items) {
      const img = await cargarImagen(it.src);
      const w = it.w * W;
      const h = w * (img.naturalHeight / img.naturalWidth);
      ctx.save();
      ctx.translate(it.x * W, it.y * H);
      ctx.rotate(((it.rot || 0) * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    return canvas;
  };

  // Exporta el trabajo listo para mandar a imprimir.
  const exportar = useCallback(async () => {
    const canvases = [];
    for (const pag of paginas) canvases.push(await renderPagina(pag));

    // Una sola hoja → imagen PNG.
    if (canvases.length === 1) {
      const blob = await new Promise((r) => canvases[0].toBlob(r, 'image/png'));
      return new File([blob], 'impresion.png', { type: 'image/png' });
    }

    // Varias hojas → PDF con el tamaño real en centímetros.
    const { jsPDF } = await import('jspdf');
    const orientacion = widthCm > heightCm ? 'landscape' : 'portrait';
    const doc = new jsPDF({ unit: 'cm', format: [widthCm, heightCm], orientation: orientacion });
    canvases.forEach((c, i) => {
      if (i > 0) doc.addPage([widthCm, heightCm], orientacion);
      doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, widthCm, heightCm);
    });
    const blob = doc.output('blob');
    return new File([blob], 'impresion.pdf', { type: 'application/pdf' });
  }, [paginas, widthCm, heightCm]);

  const totalItems = paginas.reduce((a, p) => a + p.items.length, 0);

  return {
    paginas, paginaActiva, setPaginaActiva, seleccionado, setSeleccionado,
    agregarImagenes, mover, escalar, rotar, duplicar, eliminar, traerAlFrente,
    agregarPagina, eliminarPagina, exportar, totalItems,
    widthCm, heightCm,
  };
};
