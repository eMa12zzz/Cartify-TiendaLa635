import { useState, useEffect } from 'react';
import { evaluarCalce } from '../utils/calceImpresion';

/*
 * Avisa cuando el archivo que el cliente subió (sin pasar por el editor) no
 * calza con la medida del formato elegido — proporción muy distinta, o
 * resolución demasiado baja para ese tamaño. No bloquea el envío: ver
 * calceImpresion.js para el porqué.
 *
 * Solo mide imágenes (jpg/png): un PDF no se abre como <img>, y quien sube un
 * PDF normalmente ya lo armó a propósito en el tamaño que quería.
 */
export const useCalceImpresion = (archivo, servicio) => {
  const [advertencia, setAdvertencia] = useState('');

  useEffect(() => {
    setAdvertencia('');
    if (!archivo || !servicio?.widthCm || !servicio?.heightCm) return;
    if (!archivo.type?.startsWith('image/')) return;

    const url = URL.createObjectURL(archivo);
    const img = new Image();

    img.onload = () => {
      setAdvertencia(evaluarCalce({
        anchoPx: img.naturalWidth,
        altoPx: img.naturalHeight,
        widthCm: servicio.widthCm,
        heightCm: servicio.heightCm,
      }) || '');
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;

    // Si el archivo o el formato cambian antes de que la imagen cargue, no
    // se deja un URL de objeto sin liberar colgado en memoria.
    return () => URL.revokeObjectURL(url);
  }, [archivo, servicio]);

  return advertencia;
};
