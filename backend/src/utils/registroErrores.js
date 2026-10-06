import crypto from "node:crypto";
import mongoose from "mongoose";
import errorRegistradoModel from "../models/errorRegistrado.js";
import adminModel from "../models/admin.js";
import { sendEmail } from "./sendMailMailjet.js";
import { config } from "../../config.js";

/*
 * ============================================================
 * REGISTRO DE ERRORES — registroErrores.js
 * ============================================================
 * Recibe los errores de la web y la app (POST /api/errores) y los del propio
 * servidor (app.js e index.js), los agrupa por tipo y avisa por correo al
 * administrador cuando aparece uno NUEVO o vuelve uno que se había dado por
 * resuelto. Se ven en el panel, en Sistema → Errores.
 *
 * Regla de oro: registrar un error nunca puede causar otro. Todo lo de aquí
 * se traga sus propias fallas y la petición original sigue como si nada.
 * ============================================================
 */

// El servidor solo anota sus errores en Render: la base local ES la de
// producción, y lo que se rompe probando en una computadora no es noticia.
const EN_PRODUCCION = Boolean(process.env.RENDER) || process.env.NODE_ENV === "production";

const ORIGENES_DE_AFUERA = new Set(["web", "app"]);

const cortar = (texto, max) => String(texto ?? "").replace(/\s+$/g, "").slice(0, max);

/*
 * Lo que cambia de una vez a otra sin que cambie el error: ids de Mongo,
 * números, la huella de los archivos del build (index-Bk3x9.js) y las
 * posiciones línea:columna. Sin quitarlo, cada publicación nueva o cada
 * producto distinto contaba como un error distinto.
 */
export const normalizar = (texto = "") =>
  String(texto)
    .replace(/[a-f0-9]{24}/gi, ":id")
    .replace(/-[A-Za-z0-9_]{6,12}\.(js|mjs|css)/g, ".$1")
    .replace(/:\d+:\d+/g, "")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// La primera línea de la pila que dice dónde pasó (la del propio mensaje no).
const primerMarco = (pila = "") =>
  String(pila).split("\n").map((l) => l.trim()).find((l) => /^at |@/.test(l)) || "";

export const huellaDe = ({ origen, mensaje, pila }) =>
  crypto
    .createHash("sha1")
    .update(`${origen}|${normalizar(mensaje)}|${normalizar(primerMarco(pila))}`)
    .digest("hex");

/*
 * "Chrome 126 · Android" en vez del user-agent completo: alcanza para saber
 * si un error es de un navegador en particular y no guarda más de la cuenta.
 */
// En orden: Edge, Opera y Samsung también dicen "Chrome", así que van antes.
const NAVEGADORES = [
  [/Edg\/(\d+)/, "Edge"],
  [/OPR\/(\d+)/, "Opera"],
  [/SamsungBrowser\/(\d+)/, "Samsung"],
  [/Chrome\/(\d+)/, "Chrome"],
  [/Firefox\/(\d+)/, "Firefox"],
  [/Version\/(\d+).*Safari/, "Safari"],
];

export const resumirDispositivo = (ua = "") => {
  const s = String(ua);
  let navegador = "";
  for (const [patron, nombre] of NAVEGADORES) {
    const m = s.match(patron);
    if (m) { navegador = `${nombre} ${m[1]}`; break; }
  }
  const sistema =
    (/Android/.test(s) && "Android") ||
    (/iPhone|iPad|iOS/.test(s) && "iOS") ||
    (/Windows/.test(s) && "Windows") ||
    (/Mac OS X|Macintosh/.test(s) && "Mac") ||
    (/Linux/.test(s) && "Linux") ||
    "";
  return [navegador, sistema].filter(Boolean).join(" · ") || cortar(s, 120);
};

/*
 * Lo que llega de afuera (web y app) se limpia antes de tocar la base: solo
 * los campos conocidos, con su largo máximo, y solo de los orígenes de
 * afuera. Un "servidor" que llega por la ruta pública es falso.
 */
export const limpiarReporte = (cuerpo) => {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const origen = String(cuerpo.origen || "");
  const mensaje = cortar(cuerpo.mensaje, 500);
  if (!ORIGENES_DE_AFUERA.has(origen) || !mensaje) return null;
  return {
    origen,
    mensaje,
    pila: cortar(cuerpo.pila, 4000),
    donde: cortar(cuerpo.donde, 300),
    version: cortar(cuerpo.version, 80),
    dispositivo: resumirDispositivo(cuerpo.dispositivo),
  };
};

/* ── Aviso por correo ─────────────────────────────────────── */

/*
 * Un minuto de espera junta los errores que llegan del mismo golpe (una
 * publicación rota tira varios a la vez) y nunca sale más de un correo cada
 * 15 minutos: los que lleguen mientras tanto van todos en el siguiente.
 */
const JUNTAR = 60 * 1000;
const ENTRE_CORREOS = 15 * 60 * 1000;
const MAX_EN_CORREO = 10;
let porAvisar = [];
let relojAviso = null;
let ultimoAviso = 0;

const destinatarios = async () => {
  const fijos = String(process.env.CORREO_ALERTAS || "").split(",").map((c) => c.trim()).filter(Boolean);
  if (fijos.length) return fijos;
  const admins = await adminModel.find({}, "email").lean();
  return [...new Set(admins.map((a) => a.email).filter(Boolean))];
};

const ORIGEN_EN_TEXTO = { web: "la web", app: "la app", servidor: "el servidor" };
const escaparHtml = (t) => String(t).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" }[c]));

const enviarAviso = async () => {
  const lista = porAvisar;
  porAvisar = [];
  if (!lista.length) return;
  try {
    const para = await destinatarios();
    if (!para.length) return;
    const tienda = config.tienda?.nombre || "Tienda la 635";
    const enlace = `${config.tienda?.url || ""}/errores`;
    const asunto = lista.length === 1
      ? `Algo falló en ${ORIGEN_EN_TEXTO[lista[0].origen]} — ${tienda}`
      : `${lista.length} errores nuevos — ${tienda}`;
    const renglon = (e) => `${e.reaparecio ? "Volvió a pasar" : "Nuevo"} en ${ORIGEN_EN_TEXTO[e.origen]}${e.donde ? ` (${e.donde})` : ""}: ${e.mensaje}`;
    const vistos = lista.slice(0, MAX_EN_CORREO);
    const resto = lista.length - vistos.length;
    const texto = [...vistos.map(renglon), resto > 0 ? `Y ${resto} más.` : "", "", `Verlos en el panel: ${enlace}`].join("\n");
    const html = `
      <div style="font-family:Arial,sans-serif;color:#1C1614;line-height:1.5">
        <p style="font-size:16px;font-weight:bold;margin:0 0 12px">${escaparHtml(asunto)}</p>
        <ul style="padding-left:18px;margin:0 0 16px">
          ${vistos.map((e) => `<li style="margin-bottom:8px">${escaparHtml(renglon(e))}</li>`).join("")}
        </ul>
        ${resto > 0 ? `<p style="margin:0 0 16px">Y ${resto} más.</p>` : ""}
        <p style="margin:0"><a href="${escaparHtml(enlace)}" style="color:#003049;font-weight:bold">Verlos en el panel</a></p>
      </div>`;
    await Promise.all(para.map((correo) => sendEmail(correo, asunto, html, texto)));
  } catch (error) {
    console.log("No se pudo avisar de los errores por correo: " + (error?.message || error));
  }
};

const programarAviso = (error) => {
  porAvisar.push(error);
  if (relojAviso) return; // ya hay un correo en camino: este va en él
  const espera = Math.max(JUNTAR, ultimoAviso + ENTRE_CORREOS - Date.now());
  relojAviso = setTimeout(() => {
    relojAviso = null;
    ultimoAviso = Date.now();
    enviarAviso();
  }, espera);
  // Un aviso pendiente no mantiene vivo al proceso (ni a las pruebas).
  relojAviso.unref?.();
};

/* ── Guardar ──────────────────────────────────────────────── */

export const registrarError = async (datos) => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    if (datos.origen === "servidor" && !EN_PRODUCCION) return;

    const huella = huellaDe(datos);
    const ahora = new Date();
    const previo = await errorRegistradoModel.findOneAndUpdate(
      { huella },
      {
        $inc: { veces: 1 },
        $set: {
          ultimaVez: ahora,
          resuelto: false,
          // Lo último que se vio: la versión y el dispositivo más recientes.
          ...(datos.version ? { version: datos.version } : {}),
          ...(datos.dispositivo ? { dispositivo: datos.dispositivo } : {}),
        },
        $setOnInsert: {
          origen: datos.origen,
          mensaje: cortar(datos.mensaje, 500),
          pila: cortar(datos.pila, 4000),
          donde: cortar(datos.donde, 300),
          primeraVez: ahora,
        },
      },
      // Se pide el documento de ANTES: así se sabe si es nuevo o si volvió.
      { upsert: true, new: false }
    ).lean();

    if (!previo || previo.resuelto) {
      programarAviso({ origen: datos.origen, donde: datos.donde, mensaje: cortar(datos.mensaje, 200), reaparecio: Boolean(previo) });
    }
  } catch (error) {
    console.log("No se pudo registrar un error: " + (error?.message || error));
  }
};
