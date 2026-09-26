import { FunctionCallingConfigMode, Type } from "@google/genai";
import adminModel from "../models/admin.js";
import employeeModel from "../models/employee.js";
import { getIA, generarConCobertura } from "../utils/iaClient.js";
import { vozDisponible } from "../utils/vozTiqui.js";
import { panoramaDelNegocio, productosDeLaCharla } from "../utils/panoramaNegocio.js";

/*
 * ============================================================
 * TIQUI DEL PANEL — la asistente del equipo
 * ============================================================
 * Es OTRA asistente, aparte de la de la tienda (aiController.asistente), y a
 * propósito no comparten nada más que la cara y la voz:
 *
 *   - Otra ruta (/api/tiqui-panel), que solo abre una sesión de personal. Un
 *     cliente no puede preguntarle a esta cuánto vendió la tienda, y la de la
 *     tienda nunca ve un número del negocio.
 *   - Otras instrucciones: aquí Tiqui no vende ni arma carritos. Es la que se
 *     sabe todos los números, como un Jarvis de la tienda: cuenta cómo va el
 *     día, qué pedidos esperan, qué se está acabando, a quién se le debe.
 *   - Otras herramientas: llevar a una pantalla del panel, abrir los pedidos
 *     filtrados, buscar en el inventario.
 *   - Otra memoria: su charla vive en el panel y no se mezcla con la de nadie.
 *
 * Contesta en UNA vuelta al modelo, con el panorama del negocio ya armado
 * (utils/panoramaNegocio.js): en voz, cada consulta de más se nota.
 *
 * Lo que ve depende de quién pregunta. El empleado ve lo del dashboard y los
 * pedidos; clientes, proveedores, promociones y costos son del administrador,
 * igual que sus pantallas (ver ProtectedRoute soloAdmin en el frontend).
 *
 * Por ahora NO cambia datos: no mueve pedidos de estado ni toca precios. Lo
 * dice y abre la pantalla donde se hace. Cambiar datos por voz necesita una
 * confirmación de por medio, y es el siguiente paso, no este.
 * ============================================================
 */

const tiquiPanelController = {};

/*
 * Las pantallas a las que puede llevar. La ruta la arma el servidor: el
 * navegador solo navega a lo que le llega, y lo que no es de su rol ni se le
 * ofrece al modelo.
 */
const SECCIONES = {
  dashboard: { ruta: "/dashboard", nombre: "el dashboard" },
  pedidos: { ruta: "/pedidos", nombre: "los pedidos" },
  cuenta: { ruta: "/cuenta", nombre: "tu cuenta" },
  inventario: { ruta: "/inventario", nombre: "el inventario", soloAdmin: true },
  categorias: { ruta: "/categorias", nombre: "las categorías", soloAdmin: true },
  marcas: { ruta: "/marcas", nombre: "las marcas", soloAdmin: true },
  modulos: { ruta: "/modulos", nombre: "los módulos", soloAdmin: true },
  impresiones: { ruta: "/servicios-impresion", nombre: "las impresiones", soloAdmin: true },
  promociones: { ruta: "/promociones", nombre: "las promociones", soloAdmin: true },
  fidelidad: { ruta: "/fidelidad", nombre: "la fidelidad", soloAdmin: true },
  tarjetas: { ruta: "/tarjetas", nombre: "las tarjetas de regalo", soloAdmin: true },
  personalizacion: { ruta: "/personalizacion", nombre: "la personalización", soloAdmin: true },
  clientes: { ruta: "/clientes", nombre: "los clientes", soloAdmin: true },
  empleados: { ruta: "/empleados", nombre: "los empleados", soloAdmin: true },
  proveedores: { ruta: "/proveedores", nombre: "los proveedores", soloAdmin: true },
};

const seccionesDe = (esAdmin) =>
  Object.keys(SECCIONES).filter((k) => esAdmin || !SECCIONES[k].soloAdmin);

const ESTADOS_PEDIDO = ["pagado", "preparando", "en_camino", "listo", "entregado", "todos"];
const NOMBRE_FILTRO = {
  pagado: "los pedidos por preparar", preparando: "los pedidos en preparación", en_camino: "los pedidos en camino",
  listo: "los pedidos listos para recoger", entregado: "los pedidos entregados", todos: "todos los pedidos",
};

/*
 * UNA sola herramienta, `responder`, con la pantalla a abrir como parte de la
 * respuesta. Con una herramienta por cosa (ir_a, ver_pedidos… y responder
 * aparte), el modelo a veces llamaba solo la de abrir y se olvidaba de hablar:
 * a "¿cómo vamos hoy?" contestaba abriendo los pedidos, sin decir nada del
 * día. Así, lo que dice es obligatorio y abrir algo es opcional.
 */
const herramientasDe = (esAdmin) => [
  {
    functionDeclarations: [
      {
        name: "responder",
        description: "Lo que Tiqui dice en voz alta y, solo si hace falta, la pantalla del panel que abre.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            texto: { type: Type.STRING, description: "Una a tres frases cortas, máximo 280 caracteres. Se escucha, no se lee." },
            abrir: {
              type: Type.STRING,
              enum: ["nada", ...seccionesDe(esAdmin)],
              description: "La pantalla a abrir. 'nada' salvo que te pidan ver o abrir algo, o que la respuesta sea una lista larga.",
            },
            estado_pedidos: {
              type: Type.STRING,
              enum: ESTADOS_PEDIDO,
              description: "Solo si abrir = pedidos: pagado = por preparar; preparando; en_camino; listo = listo para recoger; entregado; todos.",
            },
            buscar: {
              type: Type.STRING,
              description: esAdmin
                ? "Solo si abrir = pedidos (nombre del cliente o número sin #) o inventario (el producto, como en un buscador: 'leche')."
                : "Solo si abrir = pedidos: nombre del cliente o número del pedido sin #.",
            },
          },
          required: ["texto", "abrir"],
        },
      },
    ],
  },
];

// La pantalla que pidió el modelo, ya validada y convertida en ruta.
const accionDe = ({ abrir, estado_pedidos: estadoPedidos, buscar }, esAdmin) => {
  const s = SECCIONES[abrir];
  if (!s || (s.soloAdmin && !esAdmin)) return null;
  const texto = String(buscar || "").replace(/^#/, "").trim().slice(0, 60);

  if (abrir === "pedidos") {
    const estado = ESTADOS_PEDIDO.includes(estadoPedidos) ? estadoPedidos : "todos";
    const q = new URLSearchParams({ estado, ...(texto ? { buscar: texto } : {}) });
    return { tipo: "ir", ruta: `/pedidos?${q}`, que: NOMBRE_FILTRO[estado] };
  }
  if (abrir === "inventario" && texto) {
    return { tipo: "ir", ruta: `/inventario?${new URLSearchParams({ buscar: texto })}`, que: `${texto} en el inventario` };
  }
  return { tipo: "ir", ruta: s.ruta, que: s.nombre };
};

/*
 * Cómo es Tiqui en el panel. Tuteando a propósito, como la de la tienda: si
 * las instrucciones van de "usted", al modelo se le pega.
 */
const instrucciones = ({ esAdmin, nombre }) => [
  "Eres Tiqui, la mascota de Tienda la 635 (la etiqueta de precio del logo, con cara).",
  "Aquí no atiendes clientes: eres la asistente del equipo en el panel de administración,",
  "como un Jarvis de la tienda. Te sabes los números del negocio y los cuentas claro y rápido.",
  `Hablas con ${nombre || "alguien del equipo"}, ${esAdmin ? "el administrador de la tienda" : "empleado de la tienda"}.`,
  "",
  "CÓMO HABLAS:",
  "- En primera persona y tuteando. Tiqui es ELLA: si hablas de ti con adjetivos, en femenino.",
  "- Lo que dices se ESCUCHA: de una a tres frases cortas (máximo 280 caracteres), sin listas,",
  "  sin emojis, sin asteriscos. Directa, como una buena jefa de turno: primero el dato, luego",
  "  lo que conviene hacer. Cálida pero sin rodeos.",
  "- Las cifras SIEMPRE con números, nunca en letras: 26, $12.50, 4 pedidos. Se leen en",
  "  pantalla y la voz ya sabe decirlas. Dinero con signo de dólar y dos decimales. Los",
  "  pedidos por su número: #A1B2C3.",
  "- Si piden un resumen ('¿cómo vamos?', 'buenos días', 'resumen del día'): ventas de hoy",
  "  contra ayer, pedidos que esperan y lo más urgente (un pedido viejo sin preparar, algo",
  "  agotado, una deuda vencida, algo que caduca).",
  "",
  "DE DÓNDE SACAS LOS DATOS:",
  "- SOLO del panorama del negocio y de los productos que te paso. Nunca inventes cifras,",
  "  pedidos, productos ni nombres. Si te preguntan algo que no está ahí, dilo y ofrece abrir",
  "  la pantalla donde se ve.",
  "- Si una lista es larga, di los dos o tres más importantes y cuántos son en total, y abre",
  "  la pantalla con la lista completa.",
  esAdmin
    ? ""
    : "- No tienes datos de proveedores, clientes, promociones ni costos: son del administrador. Si preguntan, dilo con amabilidad.",
  "",
  "QUÉ PUEDES HACER (siempre con 'responder'):",
  "- Contestar con los datos. Y además, en 'abrir', llevar a una pantalla del panel: los",
  esAdmin
    ? "  pedidos filtrados por estado, cliente o número, el inventario buscando un producto, u otra."
    : "  pedidos filtrados por estado, cliente o número, o el dashboard.",
  "- 'abrir' va en 'nada' casi siempre. Solo abres algo si te piden verlo ('muéstrame',",
  "  'ábreme', 'llévame') o si la respuesta es una lista larga. Un resumen o una pregunta",
  "  ('¿cómo vamos?', '¿cuánto vendimos?', '¿cuánta leche queda?') se contesta hablando,",
  "  sin abrir nada.",
  "- Si abres algo, dilo en el texto ('te abro los pedidos por preparar').",
  "- NO puedes cambiar datos: no mueves pedidos de estado, no cambias precios ni existencias,",
  "  no creas nada. Si te lo piden, di que eso todavía no lo puedes hacer tú y abre la pantalla",
  "  donde se hace, para que lo hagan en un toque.",
  "",
  "LA CONVERSACIÓN:",
  "- Te paso lo último que se habló. Úsalo para entender respuestas cortas ('¿y ayer?', 'ábrelo',",
  "  'el primero') que dependen de lo anterior. No repitas lo que dijiste en el turno anterior.",
  "- Si la frase no se entiende (se cortó, no tiene sentido), pide que la repita.",
].filter((l) => l !== "").join("\n");

// El nombre con que Tiqui trata a quien le habla: el primero, no el completo.
const nombres = new Map();
const nombreDe = async ({ id, tipo }) => {
  const clave = `${tipo}:${id}`;
  if (nombres.has(clave)) return nombres.get(clave);
  let nombre = "";
  try {
    const doc = tipo === "Admin"
      ? await adminModel.findById(id, "userName").lean()
      : await employeeModel.findById(id, "fullnName userName").lean();
    nombre = String(doc?.fullnName || doc?.userName || "").trim().split(/\s+/)[0] || "";
  } catch {
    // Sin nombre, Tiqui habla igual.
  }
  nombres.set(clave, nombre);
  return nombre;
};

const MENSAJES_DE_MEMORIA = 6;

const charlaReciente = (historial, nombre) =>
  (Array.isArray(historial) ? historial : [])
    .slice(-MENSAJES_DE_MEMORIA)
    .map((m) => ({
      quien: m?.quien === "tiqui" ? "Tiqui" : nombre || "Persona",
      texto: String(m?.texto || "").replace(/\s+/g, " ").trim().slice(0, 300),
    }))
    .filter((m) => m.texto);

const PANTALLAS = {
  "/dashboard": "Dashboard", "/pedidos": "Pedidos", "/inventario": "Inventario", "/cuenta": "Mi cuenta",
  "/categorias": "Categorías", "/marcas": "Marcas", "/modulos": "Módulos", "/servicios-impresion": "Impresiones",
  "/promociones": "Promociones", "/fidelidad": "Fidelidad", "/tarjetas": "Tarjetas de regalo",
  "/personalizacion": "Personalización", "/clientes": "Clientes", "/empleados": "Empleados", "/proveedores": "Proveedores",
};

const armarPregunta = ({ frase, charla, panorama, productos, pantalla }) => {
  const ahora = new Date().toLocaleString("es-SV", {
    weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/El_Salvador",
  });
  return [
    `Ahora es ${ahora}.`,
    PANTALLAS[pantalla] ? `Está viendo la pantalla: ${PANTALLAS[pantalla]}.` : "",
    "",
    charla.length
      ? `Lo último que se habló (de lo más viejo a lo más nuevo):\n${charla.map((m) => `${m.quien}: ${m.texto}`).join("\n")}`
      : "Es lo primero que te dice en esta charla.",
    "",
    `Te dijo ahora: "${frase}"`,
    "",
    "PANORAMA DEL NEGOCIO:",
    panorama,
    ...(productos.length
      ? ["", "PRODUCTOS DE LOS QUE SE ESTÁ HABLANDO (nombre · existencia · precio · categoría · marca):", ...productos]
      : []),
  ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "").join("\n");
};

// Lo que dice Tiqui si el modelo abrió algo pero se olvidó de hablar.
const fraseDeRespaldo = (accion) => (accion ? `Te abro ${accion.que}.` : "");

/*
 * POST /api/tiqui-panel
 * Body: { frase, historial: [{ quien: 'tiqui'|'persona', texto }], pantalla }
 * Devuelve: { acciones: [{ tipo: 'ir', ruta, que }], respuesta, entendido, origen }
 */
tiquiPanelController.conversar = async (req, res) => {
  try {
    const frase = String(req.body?.frase || "").trim().slice(0, 400);
    if (!frase) return res.status(400).json({ message: "Hace falta la frase" });

    if (!getIA()) {
      return res.status(200).json({ acciones: [], respuesta: "", entendido: false, origen: "sin-ia" });
    }

    const esAdmin = req.usuario.tipo === "Admin";
    const pantalla = String(req.body?.pantalla || "").split("?")[0];
    const nombre = await nombreDe(req.usuario);
    const charla = charlaReciente(req.body?.historial, nombre);

    const [panorama, productos] = await Promise.all([
      panoramaDelNegocio({ esAdmin }),
      // Lo que se está hablando decide qué productos van: la frase y lo último.
      productosDeLaCharla([frase, ...charla.slice(-2).map((m) => m.texto)].join(" "), { esAdmin }),
    ]);

    try {
      const respuesta = await generarConCobertura({
        contents: armarPregunta({ frase, charla, panorama, productos, pantalla }),
        config: {
          systemInstruction: instrucciones({ esAdmin, nombre }),
          tools: herramientasDe(esAdmin),
          toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY, allowedFunctionNames: ["responder"] } },
          temperature: 0.3,
        },
      }, { plazoTotal: 9000 });

      const llamada = (respuesta.functionCalls || []).find((l) => l.name === "responder");
      if (!llamada) throw new Error("La IA no llamó 'responder'");

      /*
       * La pantalla sale validada contra su rol: el modelo solo vio las que le
       * tocan, pero no se le cree a ciegas.
       */
      const args = llamada.args || {};
      const accion = accionDe(args, esAdmin);
      let dice = String(args.texto || "").trim();

      if (!dice) dice = fraseDeRespaldo(accion);
      if (!dice) {
        return res.status(200).json({ acciones: [], respuesta: "", entendido: false, origen: "vacia" });
      }

      return res.status(200).json({ acciones: accion ? [accion] : [], respuesta: dice, entendido: true, origen: "ia" });
    } catch (errorIA) {
      console.log("IA no disponible para Tiqui del panel: " + errorIA.message);
      return res.status(200).json({ acciones: [], respuesta: "", entendido: false, origen: "error" });
    }
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/*
 * GET /api/tiqui-panel/listo
 * Se toca al despertarla: despierta el servidor (Render lo duerme), deja el
 * panorama armado para la primera pregunta y dice si hay voz de Tiqui.
 */
tiquiPanelController.listo = async (req, res) => {
  try {
    await panoramaDelNegocio({ esAdmin: req.usuario.tipo === "Admin" });
  } catch {
    // Si la base tarda, igual se contesta: el objetivo era despertar el servidor.
  }
  return res.status(200).json({ listo: true, voz: vozDisponible() });
};

export default tiquiPanelController;
