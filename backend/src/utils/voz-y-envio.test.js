import { describe, it, expect } from "vitest";
import { paraDecir } from "./vozTiqui.js";
import { calcularEnvio, RADIO_MAXIMO_KM } from "./envio.js";

/*
 * Lo que Tiqui dice en voz alta y hasta dónde se entrega.
 */

describe("lo que Tiqui dice en voz alta", () => {
  it("la tienda es la seis tres cinco, nunca seiscientos treinta y cinco", () => {
    expect(paraDecir("Bienvenida a Tienda la 635")).toBe("Bienvenida a Tienda la seis tres cinco");
  });

  it("los precios se dicen en dólares y centavos", () => {
    expect(paraDecir("Cuesta $2.50")).toBe("Cuesta 2 dólares con 50 centavos");
    expect(paraDecir("$1.01")).toBe("1 dólar con 1 centavo");
    expect(paraDecir("$3")).toBe("3 dólares");
    expect(paraDecir("$0.35")).toBe("35 centavos");
    expect(paraDecir("$4.5")).toBe("4 dólares con 50 centavos");
  });

  it("las promos 2x1 se dicen 2 por 1", () => {
    expect(paraDecir("Llévate 3x2 en churritos")).toBe("Llévate 3 por 2 en churritos");
  });
});

describe("hasta dónde se entrega", () => {
  const tienda = { lat: 13.7063, lng: -89.2183 };

  it("dentro del radio se entrega", () => {
    expect(calcularEnvio({ ubicacionTienda: tienda }, { lat: 13.70, lng: -89.20 }).fueraDeCobertura).toBe(false);
  });

  it(`más allá de ${RADIO_MAXIMO_KM} km no se acepta a domicilio`, () => {
    expect(calcularEnvio({ ubicacionTienda: tienda }, { lat: 37.42, lng: -122.08 }).fueraDeCobertura).toBe(true);
  });

  it("la tienda puede achicar su radio", () => {
    expect(calcularEnvio({ ubicacionTienda: tienda, radioMaximoKm: 2 }, { lat: 13.75, lng: -89.2183 }).fueraDeCobertura).toBe(true);
  });
});
