import { describe, it, expect } from "vitest";
import { paraDecir, conEmocion, animoValido, ANIMOS_IA } from "./vozTiqui.js";
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

/*
 * Sin llamar a ElevenLabs: solo se revisa el texto que se le mandaría.
 */
describe("el ánimo con que habla Tiqui", () => {
  it("con un modelo que entiende emociones, la frase lleva su etiqueta", () => {
    expect(conEmocion("¡Me encanta!", "rie", "eleven_v4_turbo")).toBe("[laughs] ¡Me encanta!");
    expect(conEmocion("¡Mira nada más!", "asombrada", "eleven_v3_conversational")).toBe("[surprised] ¡Mira nada más!");
  });

  it("con Flash va tal cual: leería la etiqueta en voz alta", () => {
    expect(conEmocion("¡Me encanta!", "rie", "eleven_flash_v2_5")).toBe("¡Me encanta!");
  });

  it("lo normal, o un ánimo que no existe, no lleva etiqueta", () => {
    expect(conEmocion("Hola", "normal", "eleven_v4_turbo")).toBe("Hola");
    expect(conEmocion("Hola", animoValido("enojada"), "eleven_v4_turbo")).toBe("Hola");
    expect(animoValido(undefined)).toBe("normal");
  });

  it("recién despertada bosteza, pero ese ánimo lo pone la app y no la IA", () => {
    expect(conEmocion("Uy, ya desperté.", "despertando", "eleven_v4_turbo")).toBe("[yawns] Uy, ya desperté.");
    expect(ANIMOS_IA).not.toContain("despertando");
    expect(ANIMOS_IA).toContain("rie");
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
