import { z } from "zod";
import { MAX_LISTING_IMAGES } from "./constants";

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresá tu nombre").max(50),
  lastName: z.string().trim().min(2, "Ingresá tu apellido").max(50),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100),
  province: z.string().trim().min(1, "Elegí tu provincia"),
  city: z.string().trim().min(1, "Ingresá tu ciudad"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

const imageInput = z.object({
  url: z.string().min(1),
  publicId: z.string().nullable().optional(),
});

export const listingSchema = z.object({
  title: z.string().trim().min(3, "El título es muy corto").max(100),
  description: z.string().trim().min(10, "La descripción es muy corta").max(5000),
  price: z.coerce.number().positive("El precio debe ser mayor a 0").max(999_999_999),
  categoryId: z.string().min(1, "Elegí una categoría"),
  condition: z.enum(["GOOD", "VERY_GOOD", "LIKE_NEW"], {
    errorMap: () => ({ message: "Elegí la condición" }),
  }),
  province: z.string().trim().min(1, "Elegí la provincia"),
  city: z.string().trim().min(1, "Ingresá la ciudad"),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  images: z
    .array(imageInput)
    .min(1, "Subí al menos una foto")
    .max(MAX_LISTING_IMAGES, `Máximo ${MAX_LISTING_IMAGES} fotos`),
});
export type ListingInput = z.infer<typeof listingSchema>;

export const verificationSubmitSchema = z.object({
  dniNumber: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, "Ingresá un número de DNI válido (7 u 8 dígitos)"),
  dniFront: z.string().startsWith("data:image/", "Foto del frente del DNI requerida"),
  dniBack: z.string().startsWith("data:image/", "Foto del dorso del DNI requerida"),
  selfie: z.string().startsWith("data:image/", "Selfie requerida"),
  // Scores calculados en el cliente con face-api (opcionales; si faltan, se revisa a mano)
  matchScore: z.coerce.number().min(0).max(1).optional(),
  livenessScore: z.coerce.number().min(0).max(1).optional(),
});
export type VerificationSubmitInput = z.infer<typeof verificationSubmitSchema>;

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Escribí un mensaje").max(2000),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresá tu nombre").max(50),
  lastName: z.string().trim().min(2, "Ingresá tu apellido").max(50),
  province: z.string().trim().min(1, "Elegí tu provincia"),
  city: z.string().trim().min(1, "Ingresá tu ciudad"),
  avatarUrl: z.string().max(500).optional().nullable(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres").max(100),
});

export const reportSchema = z.object({
  reason: z.enum(["FRAUD", "FAKE", "PROHIBITED", "SPAM", "OTHER"], {
    errorMap: () => ({ message: "Elegí un motivo" }),
  }),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  targetId: z.string().min(1),
  listingId: z.string().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

// Parámetros de búsqueda (provenientes de query string)
export const searchSchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  condition: z.enum(["GOOD", "VERY_GOOD", "LIKE_NEW"]).optional(),
  distance: z.coerce.number().positive().optional(), // km
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  sort: z.enum(["recent", "price_asc", "price_desc", "nearest"]).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
});
export type SearchParams = z.infer<typeof searchSchema>;
