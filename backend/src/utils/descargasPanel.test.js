import { describe, it, expect } from "vitest";
import { guardarDescarga, tomarDescarga, nombreSeguro, VIDA_DE_LA_DESCARGA_MS, TAMANO_MAXIMO } from "./descargasPanel.js";

/*
 * Los reportes del panel que se bajan desde la app del teléfono.
 */

const pdf = Buffer.from("%PDF-1.4 prueba");

describe("las descargas del panel en la app", () => {
  it("guarda el archivo y lo entrega con su nombre y tipo", () => {
    const { clave } = guardarDescarga({ nombre: "reporte-la635.pdf", tipo: "application/pdf", datos: pdf });
    const d = tomarDescarga(clave);
    expect(d.nombre).toBe("reporte-la635.pdf");
    expect(d.tipo).toBe("application/pdf");
    expect(d.datos.equals(pdf)).toBe(true);
  });

  it("se puede bajar unas pocas veces, no para siempre", () => {
    const { clave } = guardarDescarga({ nombre: "a.pdf", tipo: "application/pdf", datos: pdf });
    expect(tomarDescarga(clave)).not.toBeNull();
    expect(tomarDescarga(clave)).not.toBeNull();
    expect(tomarDescarga(clave)).not.toBeNull();
    expect(tomarDescarga(clave)).not.toBeNull();
    expect(tomarDescarga(clave)).toBeNull();
  });

  it("vence a los dos minutos", () => {
    const ahora = 5_000_000;
    const { clave } = guardarDescarga({ nombre: "a.pdf", tipo: "application/pdf", datos: pdf }, ahora);
    expect(tomarDescarga(clave, ahora + VIDA_DE_LA_DESCARGA_MS + 1)).toBeNull();
  });

  it("solo acepta lo que arma el panel", () => {
    expect(guardarDescarga({ nombre: "x.html", tipo: "text/html", datos: pdf }).error).toBeTruthy();
    expect(guardarDescarga({ nombre: "x.pdf", tipo: "application/pdf", datos: Buffer.alloc(0) }).error).toBeTruthy();
    expect(guardarDescarga({ nombre: "x.pdf", tipo: "application/pdf", datos: Buffer.alloc(TAMANO_MAXIMO + 1) }).error).toBeTruthy();
    expect(guardarDescarga({ nombre: "cita.ics", tipo: "text/calendar; charset=utf-8", datos: pdf }).clave).toBeTruthy();
  });

  it("una clave inventada no encuentra nada", () => {
    expect(tomarDescarga("0".repeat(48))).toBeNull();
    expect(tomarDescarga("../../etc/passwd")).toBeNull();
  });

  it("el nombre no trae rutas ni comillas", () => {
    expect(nombreSeguro('../../reporte "oct".pdf')).toBe("reporte-oct-.pdf");
    expect(nombreSeguro("Inventario días.pdf")).toBe("Inventario-dias.pdf");
    expect(nombreSeguro("")).toBe("archivo");
  });
});
