/*
 * ============================================================
 * COLOR DE LA MARCA — colorMarca.js
 * ============================================================
 * De UN color base saca toda la escala que usa la tienda (--marca-700 … 50 +
 * --acento). Así el dueño elige un solo color en el panel y la tienda entera se
 * repinta coherente, sin pedirle que acierte cinco tonos a mano.
 *
 * Se trabaja en HSL: mismo tono, se mueve solo la luminosidad (y un poco la
 * saturación en los tonos claros) para que la escala se sienta de la misma
 * familia. Es lo mismo que hacen a ojo los temas de temporada.
 * ============================================================
 */

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// "#abc" o "#aabbcc" → { r, g, b } (0-255). Devuelve null si no es válido.
export const hexAValido = (hex) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(hex || '').trim());

const hexARgb = (hex) => {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbAHsl = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
};

const hslAHex = (h, s, l) => {
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const aByte = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${aByte(r)}${aByte(g)}${aByte(b)}`;
};

/*
 * Devuelve el objeto de variables --marca-* + --acento derivado del color base.
 * Misma forma que los temas de temporada, para que aplicarTema() lo pinte igual.
 */
export const derivarMarca = (hexBase) => {
  if (!hexAValido(hexBase)) return null;
  const { h, s, l } = rgbAHsl(hexARgb(hexBase));

  return {
    // 600 es el color tal cual lo eligió el dueño: es la voz de la marca.
    '--marca-600': hslAHex(h, s, l),
    // 700: presionado / texto sobre claro. Un escalón más oscuro.
    '--marca-700': hslAHex(h, s, clamp(l - 14, 12, 90)),
    // 400: hover suave y bordes. Más claro y un pelo menos saturado.
    '--marca-400': hslAHex(h, clamp(s - 8, 0, 100), clamp(l + 16, 20, 82)),
    // 100: fondo de chip. Muy claro, saturación baja para que no compita.
    '--marca-100': hslAHex(h, clamp(s, 0, 48), 91),
    // 50: realce tenue de sección.
    '--marca-50': hslAHex(h, clamp(s, 0, 40), 96),
    // Acento de acción ("Editar", activos): mismo tono, más vivo.
    '--acento': hslAHex(h, clamp(s + 12, 40, 100), clamp(l, 46, 56)),
  };
};

// Tres muestras para el previo del panel: base, presionado y chip.
export const muestrasDeMarca = (hexBase) => {
  const c = derivarMarca(hexBase);
  return c ? [c['--marca-600'], c['--marca-700'], c['--marca-100']] : [];
};
