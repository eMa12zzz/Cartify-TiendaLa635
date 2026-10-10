import { describe, it, expect } from "vitest";
import { limpiarDisfraces, MAXIMO_DE_DISFRACES } from "./disfracesTiqui.js";

/*
 * Lo que el panel puede guardar como disfraz de Tiqui.
 */

describe("los disfraces que arma el dueño", () => {
  it("guarda las piezas con sus colores en mayúsculas", () => {
    const { disfraces, error } = limpiarDisfraces({
      navidad: {
        cabeza: { tipo: "corona", principal: "#ffc23d", acento: "#e11d48" },
        cara: { tipo: "lentes-sol", principal: "#1F2937", acento: "#FFC23D" },
        rubor: true,
      },
    });
    expect(error).toBeUndefined();
    expect(disfraces.navidad).toEqual({
      cabeza: { tipo: "corona", principal: "#FFC23D", acento: "#E11D48" },
      cara: { tipo: "lentes-sol", principal: "#1F2937", acento: "#FFC23D" },
      cuello: null,
      rubor: true,
    });
  });

  it("un disfraz sin piezas es válido: Tiqui va sin disfraz", () => {
    const { disfraces } = limpiarDisfraces({ "propia-regreso-a-clases": {} });
    expect(disfraces["propia-regreso-a-clases"]).toEqual({ cabeza: null, cara: null, cuello: null, rubor: false });
  });

  it("rechaza piezas que no existen o en el lugar equivocado", () => {
    expect(limpiarDisfraces({ navidad: { cabeza: { tipo: "capa", principal: "#000000", acento: "#000000" } } }).error).toBeTruthy();
    expect(limpiarDisfraces({ navidad: { cuello: { tipo: "corona", principal: "#000000", acento: "#000000" } } }).error).toBeTruthy();
  });

  it("rechaza colores mal escritos", () => {
    expect(limpiarDisfraces({ navidad: { cara: { tipo: "lentes", principal: "rojo", acento: "#000000" } } }).error).toMatch(/colores/);
  });

  it("no deja claves que Mongo no acepta ni listas enormes", () => {
    expect(limpiarDisfraces({ "a.b": {} }).error).toBeTruthy();
    expect(limpiarDisfraces({ $set: {} }).error).toBeTruthy();
    expect(limpiarDisfraces([]).error).toBeTruthy();
    const muchos = Object.fromEntries(Array.from({ length: MAXIMO_DE_DISFRACES + 1 }, (_, i) => [`propia-${i}`, {}]));
    expect(limpiarDisfraces(muchos).error).toBeTruthy();
  });
});
