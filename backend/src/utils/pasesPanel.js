/*
 * ============================================================
 * EL PASE DEL PANEL — pasesPanel.js
 * ============================================================
 * El administrador puede abrir el panel web DENTRO de la app del teléfono
 * (movil/src/pages/personal/PanelWeb.js). La app ya tiene su sesión, pero el
 * panel corre en un navegador aparte dentro de ella, con sus propias cookies:
 * sin esto, le pediría otra vez la contraseña y el código del correo.
 *
 * El puente es un PASE de un solo uso:
 *   1. La app, con su sesión, pide un pase  (POST /loginAdmin/pase-app).
 *   2. Abre el panel en /admin/desde-app?pase=…
 *   3. El panel lo canjea (POST /loginAdmin/pase-app/canjear) y el servidor
 *      le abre la sesión igual que en el login de siempre.
 *
 * El pase vence en un minuto y se borra al usarse: aunque quedara anotado en
 * algún historial, ya no sirve. Se guarda solo su huella, nunca el pase.
 *
 * Vive en memoria y no en la base: el servidor es uno solo, y si se reinicia
 * justo en ese minuto, la app pide otro.
 * ============================================================
 */

import crypto from "crypto";

export const VIDA_DEL_PASE_MS = 60 * 1000;

const pases = new Map(); // huella → { id, vence }

const huellaDe = (pase) => crypto.createHash("sha256").update(String(pase)).digest("hex");

const limpiarVencidos = (ahora) => {
  for (const [huella, pase] of pases) if (pase.vence <= ahora) pases.delete(huella);
};

// Un pase nuevo para la cuenta `id`. Devuelve el pase (64 letras y números).
export const crearPase = (id, ahora = Date.now()) => {
  limpiarVencidos(ahora);
  const pase = crypto.randomBytes(32).toString("hex");
  pases.set(huellaDe(pase), { id: String(id), vence: ahora + VIDA_DEL_PASE_MS });
  return pase;
};

// El id de quien lo pidió, o null si no existe, ya se usó o venció.
export const canjearPase = (pase, ahora = Date.now()) => {
  if (!/^[0-9a-f]{64}$/.test(String(pase ?? ""))) return null;
  const huella = huellaDe(pase);
  const guardado = pases.get(huella);
  pases.delete(huella);
  if (!guardado || guardado.vence <= ahora) return null;
  return guardado.id;
};
