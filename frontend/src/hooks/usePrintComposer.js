import { useState, useRef, useCallback, useMemo } from 'react';

/*
 * usePrintComposer — el "cerebro" del editor de impresiones.
 *
 * La hoja es SIEMPRE tamaño carta (o el formato elegido, si es más grande que
 * una carta — un póster no cabe tiled). Adentro se traza una CUADRÍCULA de
 * celdas del tamaño exacto del formato elegido (10×10, pasaporte, lo que
 * sea): tantas columnas y filas como quepan. Cada foto que se sube va a la
 * siguiente celda vacía y la llena por completo — se recorta lo que sobre,
 * nunca queda una foto chica flotando en una hoja enorme.
 *
 * ANTES el editor era de posición libre: se subía una foto y quedaba del
 * tamaño de la HOJA (10×10 si el formato era 10×10), así que imprimir tres
 * fotitos de carnet gastaba tres hojas enteras. Ahora esas tres fotos caen en
 * tres celdas de la MISMA hoja carta, como en una tira de fotomatón.
 *
 * Soporta VARIAS PÁGINAS: al llenarse la cuadrícula de una, la siguiente foto
 * abre una página nueva sola.
 *
 * Al exportar sale un PDF (jsPDF), con el tamaño real de la hoja en cm.
 */

const DPI = 300;             // calidad de impresión
const MAX_LADO_PX = 4000;    // tope para que una hoja grande no reviente la memoria

// Papel carta: el que carga la impresora cuando el formato elegido es más
// chico que una hoja entera (10×10, pasaporte...). Un formato más grande que
// esto (un póster) manda su propio tamaño: no tiene sentido "tilear" algo que
// ya es más grande que el papel de siempre.
const CARTA_ANCHO_CM = 21.6;
const CARTA_ALTO_CM = 27.9;

// Carga una imagen y espera a que esté lista (para dibujarla en el canvas).
const cargarImagen = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const usePrintComposer = ({ widthCm = 21.6, heightCm = 27.9 } = {}) => {
  /*
   * La cuadrícula: cuántas celdas de `widthCm × heightCm` caben en una hoja
   * carta. Un formato más grande que la carta en cualquier lado se queda con
   * SU propio tamaño de hoja y una sola celda — así un póster de 40×60 sigue
   * ocupando su hoja completa, como antes.
   */
  const { columnas, filas, celdasPorHoja, hojaAnchoCm, hojaAltoCm } = useMemo(() => {
    const cabeEnCarta = widthCm <= CARTA_ANCHO_CM && heightCm <= CARTA_ALTO_CM;
    const anchoHoja = cabeEnCarta ? CARTA_ANCHO_CM : widthCm;
    const altoHoja = cabeEnCarta ? CARTA_ALTO_CM : heightCm;
    const cols = Math.max(1, Math.floor(anchoHoja / widthCm));
    const fils = Math.max(1, Math.floor(altoHoja / heightCm));
    return { columnas: cols, filas: fils, celdasPorHoja: cols * fils, hojaAnchoCm: anchoHoja, hojaAltoCm: altoHoja };
  }, [widthCm, heightCm]);

  // Cada página es un arreglo de `celdasPorHoja` casillas: null (vacía) o
  // { id, src }. El índice EN el arreglo es la posición en la cuadrícula.
  const celdaVacia = () => Array(celdasPorHoja).fill(null);
  const [paginas, setPaginas] = useState([{ id: 'pagina-0', celdas: celdaVacia() }]);
  const [paginaActiva, setPaginaActiva] = useState(0);
  const [seleccionado, setSeleccionado] = useState(null); // { pagina, celda } o null
  const idRef = useRef(100);
  const nuevoId = () => ++idRef.current;

  /*
   * Si cambia el formato (otro `widthCm`/`heightCm`, ej. el cliente elige
   * "10x10" después de haber estado en "Carta"), la cuadrícula cambia de
   * forma y las páginas viejas se vuelven a empezar.
   *
   * Sin esto, la primera página se quedaba con el tamaño de cuando el
   * composer se montó por primera vez —`useState` solo lee su valor inicial
   * UNA vez, en el montaje— y las páginas siguientes sí usaban el tamaño
   * nuevo: la hoja 1 tenía una sola celda y la 2 en adelante tenían cuatro,
   * así que las fotos se repartían torcido y sobraban páginas.
   */
  const celdasPorHojaAnterior = useRef(celdasPorHoja);
  if (celdasPorHojaAnterior.current !== celdasPorHoja) {
    celdasPorHojaAnterior.current = celdasPorHoja;
    setPaginas([{ id: 'pagina-0', celdas: celdaVacia() }]);
    setPaginaActiva(0);
    setSeleccionado(null);
  }

  // Agrega imágenes: cada una cae en la SIGUIENTE celda vacía, empezando por
  // la página activa. Si no queda ninguna, se abren páginas nuevas solas.
  /*
   * El id de una página nueva se saca de `copia.length` (dónde va a quedar en
   * el arreglo) y no de un contador aparte: en StrictMode React invoca dos
   * veces la función que se le pasa a setPaginas para detectar justo esto —
   * un efecto secundario ahí adentro (un contador que avanza, una URL de
   * blob que se crea) se duplica en cada invocación y la hoja terminaba con
   * el doble de páginas de las que tocaban. `copia.length` da el MISMO
   * resultado las dos veces porque depende solo del estado de entrada.
   */
  const idDePagina = (indice) => `pagina-${indice}`;

  // A dónde saltar después de acomodar: se calcula DENTRO del cálculo puro de
  // abajo y se lee aquí, ya afuera, para no llamar a otro setState desde
  // dentro del actualizador de setPaginas.
  const paginaDestino = useRef(0);

  const agregarImagenes = useCallback((files) => {
    const lista = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (lista.length === 0) return;

    // Los ids y las URLs de objeto se generan UNA vez, aquí afuera — nunca
    // dentro del actualizador de setPaginas. Ver la nota de arriba.
    const nuevas = lista.map((file) => ({ id: nuevoId(), src: URL.createObjectURL(file) }));

    setPaginas((prev) => {
      const copia = prev.map((p) => ({ ...p, celdas: [...p.celdas] }));
      let pag = paginaActiva;

      for (const nueva of nuevas) {
        // Busca la siguiente celda vacía desde `pag`, abriendo páginas si hace falta.
        while (true) {
          if (pag >= copia.length) copia.push({ id: idDePagina(copia.length), celdas: celdaVacia() });
          const libre = copia[pag].celdas.findIndex((c) => c === null);
          if (libre !== -1) {
            copia[pag].celdas[libre] = nueva;
            paginaDestino.current = pag;
            break;
          }
          pag++;
        }
      }
      return copia;
    });
    // La vista salta a donde cayó la última foto agregada: si abrió una
    // página nueva, quien sube las fotos quiere verla, no seguir mirando la
    // que ya se llenó.
    setPaginaActiva(paginaDestino.current);
  }, [paginaActiva, celdasPorHoja]);

  // Quita la foto de una celda (la celda queda vacía, no desaparece de la cuadrícula).
  const eliminar = useCallback((paginaIdx, celdaIdx) => {
    setPaginas((prev) =>
      prev.map((p, i) => (i !== paginaIdx ? p : { ...p, celdas: p.celdas.map((c, j) => (j === celdaIdx ? null : c)) }))
    );
    setSeleccionado(null);
  }, []);

  // Duplica una foto en la siguiente celda vacía — la manera de repetir un
  // documento (un DUI, un pasaporte) varias veces en la misma hoja.
  const duplicar = useCallback((paginaIdx, celdaIdx) => {
    const origen = paginas[paginaIdx]?.celdas[celdaIdx];
    if (!origen) return;
    const copiaId = nuevoId();

    setPaginas((prev) => {
      const copia = prev.map((p) => ({ ...p, celdas: [...p.celdas] }));
      let pag = paginaIdx;
      while (true) {
        if (pag >= copia.length) copia.push({ id: idDePagina(copia.length), celdas: celdaVacia() });
        const libre = copia[pag].celdas.findIndex((c) => c === null);
        if (libre !== -1) {
          copia[pag].celdas[libre] = { id: copiaId, src: origen.src };
          break;
        }
        pag++;
      }
      return copia;
    });
  }, [paginas]);

  const agregarPagina = useCallback(() => {
    setPaginas((prev) => {
      paginaDestino.current = prev.length;
      return [...prev, { id: idDePagina(prev.length), celdas: celdaVacia() }];
    });
    setPaginaActiva(paginaDestino.current);
    setSeleccionado(null);
  }, [celdasPorHoja]);

  const eliminarPagina = useCallback((indice) => {
    setPaginas((prev) => {
      if (prev.length === 1) return prev; // siempre queda al menos una
      return prev.filter((_, i) => i !== indice);
    });
    // Afuera del actualizador de arriba, por la misma razón que paginaDestino:
    // no encadenar otro setState desde dentro de uno.
    setPaginaActiva((act) => Math.max(0, act > indice ? act - 1 : act));
    setSeleccionado(null);
  }, []);

  /*
   * Dibuja una página completa en un canvas a resolución de impresión. Cada
   * celda se llena a lo "cubrir" (como object-fit: cover): se recorta lo que
   * sobre del lado más largo, nunca queda un borde en blanco.
   */
  const renderPagina = async (pagina) => {
    const pxPorCm = DPI / 2.54;
    let W = Math.round(hojaAnchoCm * pxPorCm);
    let H = Math.round(hojaAltoCm * pxPorCm);
    let escalaHoja = 1;

    const mayor = Math.max(W, H);
    if (mayor > MAX_LADO_PX) {
      escalaHoja = MAX_LADO_PX / mayor;
      W = Math.round(W * escalaHoja);
      H = Math.round(H * escalaHoja);
    }

    /*
     * El tamaño de CADA celda en píxeles, calculado de su medida real en cm
     * —no de W/columnas—. Dividir el ancho de la hoja entre las columnas
     * estira cada celda para llenar hasta el último milímetro, y una celda
     * de 10×10 en una hoja de 21.6×27.9 con 2 columnas y 2 filas quedaba de
     * 10.8×13.95: un rectángulo, no el cuadrado que se pidió. Lo que sobra
     * de la hoja se queda en blanco, como el margen de una hoja de verdad.
     */
    const celdaWpx = widthCm * pxPorCm * escalaHoja;
    const celdaHpx = heightCm * pxPorCm * escalaHoja;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < pagina.celdas.length; i++) {
      const celda = pagina.celdas[i];
      if (!celda) continue;
      const col = i % columnas;
      const fil = Math.floor(i / columnas);
      const img = await cargarImagen(celda.src);

      // Escala "cubrir": el lado que sobra se recorta, nunca queda margen.
      const escala = Math.max(celdaWpx / img.naturalWidth, celdaHpx / img.naturalHeight);
      const wDibujo = img.naturalWidth * escala;
      const hDibujo = img.naturalHeight * escala;
      const x = col * celdaWpx + (celdaWpx - wDibujo) / 2;
      const y = fil * celdaHpx + (celdaHpx - hDibujo) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(col * celdaWpx, fil * celdaHpx, celdaWpx, celdaHpx);
      ctx.clip();
      ctx.drawImage(img, x, y, wDibujo, hDibujo);
      ctx.restore();
    }
    return canvas;
  };

  // Exporta el trabajo listo para mandar a imprimir.
  const exportar = useCallback(async () => {
    const canvases = [];
    for (const pag of paginas) canvases.push(await renderPagina(pag));

    // PDF con el tamaño real de la hoja en centímetros, tenga una o varias.
    const { jsPDF } = await import('jspdf');
    const orientacion = hojaAnchoCm > hojaAltoCm ? 'landscape' : 'portrait';
    const doc = new jsPDF({ unit: 'cm', format: [hojaAnchoCm, hojaAltoCm], orientation: orientacion });
    canvases.forEach((c, i) => {
      if (i > 0) doc.addPage([hojaAnchoCm, hojaAltoCm], orientacion);
      doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, hojaAnchoCm, hojaAltoCm);
    });
    const blob = doc.output('blob');
    return new File([blob], 'impresion.pdf', { type: 'application/pdf' });
  }, [paginas, hojaAnchoCm, hojaAltoCm, widthCm, heightCm, columnas, filas]);

  const totalItems = paginas.reduce((a, p) => a + p.celdas.filter(Boolean).length, 0);

  return {
    paginas, paginaActiva, setPaginaActiva, seleccionado, setSeleccionado,
    agregarImagenes, eliminar, duplicar,
    agregarPagina, eliminarPagina, exportar, totalItems,
    // Tamaño de la HOJA (para pintarla) y de cada CELDA (para la cuadrícula).
    widthCm: hojaAnchoCm, heightCm: hojaAltoCm,
    celdaAnchoCm: widthCm, celdaAltoCm: heightCm,
    columnas, filas, celdasPorHoja,
  };
};
