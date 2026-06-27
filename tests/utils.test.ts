import { describe, it, expect } from "vitest";
import { hideContactInfo, getInitials, formatDistance, formatPrice } from "@/lib/utils";

describe("hideContactInfo", () => {
  it("oculta emails", () => {
    const out = hideContactInfo("Escribime a juan.perez@gmail.com dale");
    expect(out).not.toContain("juan.perez@gmail.com");
    expect(out).toContain("•••");
  });

  it("oculta links http(s) y www", () => {
    expect(hideContactInfo("mirá http://insta.gram/foo")).toContain("•••");
    const www = hideContactInfo("entrá a www.misitio.com");
    expect(www).toContain("•••");
    expect(www).not.toContain("misitio");
  });

  it("oculta dominios sueltos", () => {
    const out = hideContactInfo("mi tienda es tienda.com.ar ok");
    expect(out).not.toContain("tienda.com.ar");
    expect(out).toContain("•••");
  });

  it("oculta @usuarios", () => {
    const out = hideContactInfo("seguime @miusuario_ok");
    expect(out).not.toContain("@miusuario_ok");
    expect(out).toContain("•••");
  });

  it("oculta teléfonos", () => {
    const tel = hideContactInfo("llamame 11 2345 6789");
    expect(tel).toContain("•••");
    expect(tel).not.toMatch(/2345/);
    expect(hideContactInfo("mi cel +54 9 11 1234 5678")).toContain("•••");
  });

  it("NO oculta precios con separador de miles (dígitos separados solo por puntos)", () => {
    expect(hideContactInfo("1.500.000")).toBe("1.500.000");
    expect(hideContactInfo("$1.250.000")).toBe("$1.250.000");
    expect(hideContactInfo("vale 1.200.000")).toBe("vale 1.200.000");
  });

  it("SÍ oculta teléfonos reales (espacios/guiones/+ o secuencias largas)", () => {
    const conGuion = hideContactInfo("11 2345-6789");
    expect(conGuion).toContain("•••");
    expect(conGuion).not.toMatch(/\d/);
    expect(hideContactInfo("+54 9 11 1234 5678")).toContain("•••");
    expect(hideContactInfo("1145678901")).toBe("•••");
  });

  it("NO toca texto normal (talle, precios cortos, rodado)", () => {
    expect(hideContactInfo("Zapatillas talle M, impecables")).toBe("Zapatillas talle M, impecables");
    expect(hideContactInfo("Precio 25000 negociable")).toBe("Precio 25000 negociable");
    expect(hideContactInfo("Vendo 2 sillones rodado 29")).toBe("Vendo 2 sillones rodado 29");
  });

  it("devuelve el texto vacío sin cambios", () => {
    expect(hideContactInfo("")).toBe("");
  });
});

describe("helpers puros de utils", () => {
  it("getInitials arma las iniciales en mayúscula", () => {
    expect(getInitials("Ana", "Pérez")).toBe("AP");
    expect(getInitials("ana")).toBe("A");
    expect(getInitials("", "")).toBe("");
  });

  it("formatDistance: metros si <1km, km si ≥1", () => {
    expect(formatDistance(0.8)).toBe("a 800 m");
    expect(formatDistance(2.5)).toMatch(/^a 2[.,]5 km$/);
  });

  it("formatPrice formatea en pesos sin decimales", () => {
    const out = formatPrice(1000);
    expect(out).toContain("$");
    expect(out).toMatch(/1[.\s ]?000/);
  });
});
