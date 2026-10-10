import { describe, it, expect } from "vitest";
import { crearPase, canjearPase, VIDA_DEL_PASE_MS } from "./pasesPanel.js";

/*
 * El pase con el que la app abre el panel web sin volver a pedir contraseña.
 */

describe("el pase del panel en la app", () => {
  it("sirve una sola vez", () => {
    const pase = crearPase("admin-1");
    expect(canjearPase(pase)).toBe("admin-1");
    expect(canjearPase(pase)).toBeNull();
  });

  it("vence al minuto", () => {
    const ahora = 1_000_000;
    const pase = crearPase("admin-1", ahora);
    expect(canjearPase(pase, ahora + VIDA_DEL_PASE_MS + 1)).toBeNull();
  });

  it("uno inventado o mal escrito no abre nada", () => {
    expect(canjearPase("0".repeat(64))).toBeNull();
    expect(canjearPase("hola")).toBeNull();
    expect(canjearPase(undefined)).toBeNull();
    expect(canjearPase({ $ne: null })).toBeNull();
  });

  it("cada pase es distinto", () => {
    expect(crearPase("a")).not.toBe(crearPase("a"));
  });
});
