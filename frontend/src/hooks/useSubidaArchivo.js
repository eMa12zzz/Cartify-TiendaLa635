import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/*
 * ============================================================
 * useSubidaArchivo — elegir un archivo y VERLO antes de subirlo
 * ============================================================
 * Hasta ahora cada pantalla resolvía esto por su cuenta: tres previews
 * parecidas pero distintas, y dos pantallas donde no había ninguna. La peor
 * era Impresiones — el cliente paga por imprimir algo que nunca llega a ver.
 *
 * Acá vive todo lo que NO es pintar: el archivo elegido, su URL de vista
 * previa, las validaciones, el arrastrar y soltar. El componente solo dibuja.
 *
 * Lo importante y lo fácil de olvidar: URL.createObjectURL deja el archivo
 * vivo en memoria hasta que alguien revoque esa URL. Si la persona prueba
 * ocho fotos hasta encontrar la buena, quedan ocho colgadas. Por eso soltamos
 * la anterior en cada cambio y también al desmontar.
 */

// Extensiones que el navegador va a saber dibujar en un <img>.
const IMAGENES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg', 'heic'];

/*
 * Extensión en minúsculas, sin el punto.
 * Corta antes del "?" porque las URL de Cloudinary vienen con "?v=1712..."
 * pegado atrás y si no, la extensión sale "jpg?v=1712" y no coincide con nada.
 */
export const extensionDe = (nombre = '') => {
  const limpio = String(nombre).split(/[?#]/)[0];
  const punto = limpio.lastIndexOf('.');
  return punto === -1 ? '' : limpio.slice(punto + 1).toLowerCase();
};

// Peso en algo que una persona entienda: "820 KB", "3.4 MB".
export const pesoLegible = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

/*
 * 'imagen' | 'pdf' | 'otro'. Miramos primero el mime que reporta el navegador
 * y caemos a la extensión, porque algunos sistemas mandan el archivo con el
 * mime vacío (pasa con archivos venidos de WhatsApp o de una tarjeta SD).
 */
const tipoDeArchivo = (nombre, mime = '') => {
  if (mime.startsWith('image/')) return 'imagen';
  if (mime === 'application/pdf') return 'pdf';
  const ext = extensionDe(nombre);
  if (IMAGENES.includes(ext)) return 'imagen';
  if (ext === 'pdf') return 'pdf';
  return 'otro';
};

// El mismo string del accept del <input>, partido en reglas comparables.
const reglasDeAccept = (accept) =>
  String(accept || '')
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);

const cumpleAccept = (file, reglas) => {
  if (reglas.length === 0) return true;
  const nombre = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  return reglas.some((regla) => {
    if (regla.startsWith('.')) return nombre.endsWith(regla);
    if (regla.endsWith('/*')) return mime.startsWith(regla.slice(0, -1)); // "image/"
    return mime === regla;
  });
};

/*
 * Traduce el accept a algo que se pueda leer en voz alta:
 *   "image/*"                  -> "imágenes"
 *   ".pdf,.jpg,.jpeg,.png"     -> "PDF, JPG o PNG"
 * JPG y JPEG son lo mismo para quien mira, así que no se nombran dos veces.
 */
const describirAceptados = (reglas) => {
  const nombres = [];
  reglas.forEach((regla) => {
    let etiqueta;
    if (regla === 'image/*') etiqueta = 'imágenes';
    else if (regla === 'application/pdf') etiqueta = 'PDF';
    else if (regla.startsWith('.')) etiqueta = regla.slice(1).toUpperCase();
    else etiqueta = regla.split('/').pop().toUpperCase();
    if (etiqueta === 'JPEG') etiqueta = 'JPG';
    if (!nombres.includes(etiqueta)) nombres.push(etiqueta);
  });
  if (nombres.length === 0) return 'archivos';
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(', ')} o ${nombres[nombres.length - 1]}`;
};

// Para que el error hable del archivo que la persona acaba de soltar.
const COMO_LLAMARLO = { imagen: 'Esa imagen', pdf: 'Ese PDF', otro: 'Ese archivo' };

/*
 * Parámetros:
 *   valorInicial : URL ya guardada (Cloudinary) para que al EDITAR se vea la
 *                  imagen actual y no un recuadro vacío.
 *   accept       : el mismo string que llevaría el <input type="file">.
 *   maxMB        : tope de peso. 0 lo desactiva.
 *   alElegir     : (file, url) => void. También se llama con (null, null) al
 *                  quitar, para que el padre se entere.
 *   reinicio     : cualquier valor; cuando cambia, se vuelve al estado de
 *                  recién abierto. Sirve donde la pantalla no se desmonta
 *                  (Impresiones limpia el formulario después de enviar).
 *   tipoInicial  : qué es el valorInicial cuando la URL no trae extensión.
 */
export const useSubidaArchivo = ({
  valorInicial = null,
  accept = '',
  maxMB = 8,
  alElegir,
  reinicio,
  tipoInicial = 'imagen',
} = {}) => {
  const [archivo, setArchivo] = useState(null);
  const [urlBlob, setUrlBlob] = useState(null);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  // La imagen ya guardada se sigue viendo hasta que la persona la quita a mano.
  const [inicialVisible, setInicialVisible] = useState(true);

  const inputRef = useRef(null);
  const urlRef = useRef(null);
  /*
   * El callback llega nuevo en cada render del padre. Guardado en una ref, los
   * handlers no se rearman por eso y no arrastran una versión vieja del padre.
   */
  const alElegirRef = useRef(alElegir);
  useEffect(() => { alElegirRef.current = alElegir; });

  const soltarUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  // Al desmontar: nada de blobs olvidados.
  useEffect(() => soltarUrl, [soltarUrl]);

  const reglas = useMemo(() => reglasDeAccept(accept), [accept]);

  /*
   * Guarda el archivo si pasa las dos aduanas (tipo y peso). Devuelve si entró,
   * por si quien llama quiere reaccionar.
   */
  const elegir = useCallback((file) => {
    if (!file) return false;

    if (!cumpleAccept(file, reglas)) {
      const ext = extensionDe(file.name);
      setError(
        `${ext ? `Un archivo .${ext}` : 'Ese archivo'} no se puede usar aquí: solo entran ${describirAceptados(reglas)}.`
      );
      return false;
    }

    if (maxMB > 0 && file.size > maxMB * 1024 * 1024) {
      const como = COMO_LLAMARLO[tipoDeArchivo(file.name, file.type)];
      setError(`${como} pesa ${pesoLegible(file.size)} y el máximo son ${maxMB} MB.`);
      return false;
    }

    soltarUrl(); // primero soltamos la anterior, después pedimos la nueva
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setUrlBlob(url);
    setArchivo(file);
    setInicialVisible(false);
    setError('');
    alElegirRef.current?.(file, url);
    return true;
  }, [reglas, maxMB, soltarUrl]);

  const quitar = useCallback(() => {
    soltarUrl();
    setArchivo(null);
    setUrlBlob(null);
    setInicialVisible(false); // quitar también tapa la que ya estaba guardada
    setError('');
    /*
     * Limpiar el input a mano: si no, volver a elegir EL MISMO archivo no
     * dispara onChange (el navegador ve el mismo valor) y parece que se trabó.
     */
    if (inputRef.current) inputRef.current.value = '';
    alElegirRef.current?.(null, null);
  }, [soltarUrl]);

  /*
   * Volver al estado de recién abierto cuando el padre cambia `reinicio`.
   *
   * Va durante el render y no en un useEffect a propósito: es el patrón que
   * recomienda React para "ajustar estado cuando cambia una prop". Con efecto,
   * la pantalla alcanzaba a pintar un cuadro con el archivo viejo todavía
   * puesto. Y no le avisamos al padre: si él movió `reinicio` es porque ya
   * limpió lo suyo.
   */
  const [reinicioAnterior, setReinicioAnterior] = useState(reinicio);
  if (reinicio !== reinicioAnterior) {
    setReinicioAnterior(reinicio);
    setArchivo(null);
    setUrlBlob(null);
    setInicialVisible(true);
    setError('');
  }

  /*
   * Revocar el blob y vaciar el input son cosas que tocan el navegador, así
   * que no pueden ir en el render: van aquí, en cuanto la preview queda vacía.
   * Cuando se limpió con quitar() esto ya no encuentra nada que hacer.
   */
  useEffect(() => {
    if (urlBlob) return;
    soltarUrl();
    if (inputRef.current) inputRef.current.value = '';
  }, [urlBlob, soltarUrl]);

  const alCambiarInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) elegir(file);
    // Ver el comentario de quitar(): dejarlo vacío permite reelegir lo mismo.
    e.target.value = '';
  }, [elegir]);

  const abrirSelector = useCallback(() => inputRef.current?.click(), []);

  // Enter y Espacio, para que la zona se comporte como un botón de verdad.
  const alTeclado = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const alArrastrarEncima = useCallback((e) => { e.preventDefault(); setArrastrando(true); }, []);
  const alSalirArrastre = useCallback(() => setArrastrando(false), []);
  const alSoltar = useCallback((e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) elegir(file);
  }, [elegir]);

  /* ── Lo que el componente necesita para pintar ── */

  const mostrandoGuardada = !archivo && inicialVisible && !!valorInicial;
  const url = archivo ? urlBlob : (mostrandoGuardada ? valorInicial : null);

  let tipo = null;
  if (archivo) {
    tipo = tipoDeArchivo(archivo.name, archivo.type);
  } else if (mostrandoGuardada) {
    // Una URL de Cloudinary puede venir sin extensión; ahí mandamos el default.
    const deducido = tipoDeArchivo(valorInicial);
    tipo = deducido === 'otro' ? tipoInicial : deducido;
  }

  return {
    archivo,
    url,
    tipo,
    // Sin archivo propio no sabemos ni el nombre ni el peso de lo guardado, y
    // no se inventan: se dice lo único cierto, que ya hay una imagen.
    nombre: archivo?.name || (mostrandoGuardada ? 'Imagen guardada' : ''),
    peso: archivo ? pesoLegible(archivo.size) : '',
    extension: archivo ? extensionDe(archivo.name) : extensionDe(valorInicial || ''),
    hayAlgo: !!url,
    esGuardada: mostrandoGuardada,
    error,
    arrastrando,
    inputRef,
    elegir,
    quitar,
    abrirSelector,
    alTeclado,
    alCambiarInput,
    alArrastrarEncima,
    alSalirArrastre,
    alSoltar,
  };
};

export default useSubidaArchivo;
