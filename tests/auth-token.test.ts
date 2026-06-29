import { describe, it, expect } from "vitest";
import { parseBearer } from "@/lib/auth-token";

describe("parseBearer", () => {
  it("extrae el token de un header Bearer", () => {
    expect(parseBearer("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });
  it("es case-insensitive y tolera espacios extra", () => {
    expect(parseBearer("bearer   xyz")).toBe("xyz");
    expect(parseBearer("  Bearer tok  ")).toBe("tok");
  });
  it("null si no hay header, está vacío, o no es Bearer", () => {
    expect(parseBearer(null)).toBeNull();
    expect(parseBearer(undefined)).toBeNull();
    expect(parseBearer("")).toBeNull();
    expect(parseBearer("Basic abc")).toBeNull();
    expect(parseBearer("Bearer")).toBeNull();
  });
});
