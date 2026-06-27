import { describe, it, expect } from "vitest";
import { registerSchema, listingSchema, reviewSchema } from "@/lib/validations";

describe("registerSchema", () => {
  const base = {
    firstName: "Ana",
    lastName: "Pérez",
    email: "ana@mail.com",
    password: "secret12",
    province: "Buenos Aires",
    city: "La Plata",
  };

  it("acepta datos válidos y normaliza el email (trim + minúsculas)", () => {
    const r = registerSchema.safeParse({ ...base, email: "  ANA@Mail.com  " });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("ana@mail.com");
      expect(r.data.firstName).toBe("Ana");
    }
  });

  it("rechaza nombre demasiado corto", () => {
    expect(registerSchema.safeParse({ ...base, firstName: "A" }).success).toBe(false);
  });

  it("rechaza email inválido", () => {
    expect(registerSchema.safeParse({ ...base, email: "no-es-email" }).success).toBe(false);
  });

  it("rechaza contraseña de menos de 8 caracteres", () => {
    expect(registerSchema.safeParse({ ...base, password: "corta" }).success).toBe(false);
  });
});

describe("listingSchema", () => {
  const base = {
    title: "Heladera Whirlpool",
    description: "Funciona perfecto, poco uso.",
    price: 250000,
    categoryId: "cat1",
    condition: "GOOD",
    province: "Córdoba",
    city: "Córdoba",
    images: [{ url: "/uploads/foto1.jpg" }],
  };

  it("acepta una publicación válida y hace coerce del precio desde string", () => {
    const r = listingSchema.safeParse({ ...base, price: "250000" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.price).toBe(250000);
  });

  it("acepta imágenes de Cloudinary", () => {
    const r = listingSchema.safeParse({
      ...base,
      images: [{ url: "https://res.cloudinary.com/demo/image/upload/x.jpg" }],
    });
    expect(r.success).toBe(true);
  });

  it("rechaza título muy corto", () => {
    expect(listingSchema.safeParse({ ...base, title: "ab" }).success).toBe(false);
  });

  it("rechaza precio cero o negativo", () => {
    expect(listingSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
    expect(listingSchema.safeParse({ ...base, price: -10 }).success).toBe(false);
  });

  it("rechaza sin imágenes", () => {
    expect(listingSchema.safeParse({ ...base, images: [] }).success).toBe(false);
  });

  it("rechaza imágenes externas (anti tracking pixel / fuga de IP)", () => {
    const r = listingSchema.safeParse({
      ...base,
      images: [{ url: "https://evil.example.com/pixel.png" }],
    });
    expect(r.success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("acepta rating 1..5 con comentario opcional", () => {
    const r = reviewSchema.safeParse({ targetId: "u1", rating: 5, comment: "Excelente vendedor" });
    expect(r.success).toBe(true);
  });

  it("hace coerce del rating desde string", () => {
    const r = reviewSchema.safeParse({ targetId: "u1", rating: "4" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rating).toBe(4);
  });

  it("rechaza rating fuera de rango (0 y 6)", () => {
    expect(reviewSchema.safeParse({ targetId: "u1", rating: 0 }).success).toBe(false);
    expect(reviewSchema.safeParse({ targetId: "u1", rating: 6 }).success).toBe(false);
  });

  it("rechaza rating no entero", () => {
    expect(reviewSchema.safeParse({ targetId: "u1", rating: 3.5 }).success).toBe(false);
  });

  it("rechaza si falta targetId", () => {
    expect(reviewSchema.safeParse({ rating: 5 }).success).toBe(false);
  });
});
