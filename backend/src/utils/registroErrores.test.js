import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";

/*
 * El registro de errores. La base y el correo son de mentira: se prueba que
 * agrupe bien, que no se trague basura de afuera y que avise solo de lo nuevo.
 */

vi.mock("../models/errorRegistrado.js", () => ({ default: { findOneAndUpdate: vi.fn() } }));
vi.mock("../models/admin.js", () => ({ default: { find: vi.fn() } }));
vi.mock("./sendMailMailjet.js", () => ({ sendEmail: vi.fn() }));

const { normalizar, huellaDe, resumirDispositivo, limpiarReporte, registrarError } = await import("./registroErrores.js");
const { default: errorRegistradoModel } = await import("../models/errorRegistrado.js");
const { default: adminModel } = await import("../models/admin.js");
const { sendEmail } = await import("./sendMailMailjet.js");

describe("huella: el mismo error cuenta una sola vez", () => {
  it("no distingue ids, números ni la huella de los archivos del build", () => {
    const a = { origen: "web", mensaje: "No existe el pedido 6a66fd61802fdcc013afb642", pila: "TypeError\n    at f (index-Bk3x9aQ.js:1:2345)" };
    const b = { origen: "web", mensaje: "No existe el pedido 6a66fdba802fdcc013afb643", pila: "TypeError\n    at f (index-Zz88uuRT.js:1:9876)" };
    expect(huellaDe(a)).toBe(huellaDe(b));
  });

  it("errores distintos, o del mismo mensaje en otro lado, son distintos", () => {
    const base = { origen: "web", mensaje: "Falló el pago", pila: "" };
    expect(huellaDe(base)).not.toBe(huellaDe({ ...base, mensaje: "Falló el envío" }));
    expect(huellaDe(base)).not.toBe(huellaDe({ ...base, origen: "app" }));
  });

  it("normaliza a minúsculas y sin espacios de más", () => {
    expect(normalizar("  Respondió 500 en  GET /api/order/6a66fd61802fdcc013afb642 ")).toBe("respondió # en get /api/order/:id");
  });
});

describe("lo que llega de afuera", () => {
  it("resume el dispositivo sin guardar el user-agent entero", () => {
    expect(resumirDispositivo("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0 Mobile Safari/537.36")).toBe("Chrome 126 · Android");
    expect(resumirDispositivo("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 Edg/126.0")).toBe("Edge 126 · Windows");
    expect(resumirDispositivo("Android 14")).toBe("Android");
  });

  it("acepta un reporte de la web o la app y lo recorta", () => {
    const r = limpiarReporte({ origen: "app", mensaje: "x".repeat(900), pila: "y".repeat(9000), extra: "ignorado" });
    expect(r.origen).toBe("app");
    expect(r.mensaje).toHaveLength(500);
    expect(r.pila).toHaveLength(4000);
    expect(r).not.toHaveProperty("extra");
  });

  it("rechaza lo incompleto y al que se hace pasar por el servidor", () => {
    expect(limpiarReporte(null)).toBeNull();
    expect(limpiarReporte({ origen: "web" })).toBeNull();
    expect(limpiarReporte({ origen: "servidor", mensaje: "falso" })).toBeNull();
    expect(limpiarReporte({ origen: "otro", mensaje: "x" })).toBeNull();
  });
});

describe("guardar y avisar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(1);
    adminModel.find.mockReturnValue({ lean: async () => [{ email: "dueno@tienda.com" }] });
    sendEmail.mockResolvedValue({});
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks(); });

  const reporte = { origen: "web", mensaje: "Se rompió la ficha", donde: "/producto/:id" };
  const conResultado = (previo) => errorRegistradoModel.findOneAndUpdate.mockReturnValue({ lean: async () => previo });

  it("un error nuevo se guarda contando una vez y avisa por correo", async () => {
    conResultado(null);
    await registrarError(reporte);
    const [filtro, cambios, opciones] = errorRegistradoModel.findOneAndUpdate.mock.calls[0];
    expect(filtro).toEqual({ huella: huellaDe(reporte) });
    expect(cambios.$inc).toEqual({ veces: 1 });
    expect(cambios.$setOnInsert).toMatchObject({ origen: "web", mensaje: "Se rompió la ficha" });
    expect(opciones).toMatchObject({ upsert: true });
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toBe("dueno@tienda.com");
    expect(sendEmail.mock.calls[0][1]).toMatch(/Algo falló en la web/);
  });

  it("uno que ya se conocía y sigue abierto no vuelve a avisar", async () => {
    conResultado({ huella: "x", resuelto: false });
    await registrarError(reporte);
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sin base de datos no hace nada (y no falla)", async () => {
    vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(0);
    await expect(registrarError(reporte)).resolves.toBeUndefined();
    expect(errorRegistradoModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
