import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/storage";

// Sube una imagen (data URI) y devuelve { url, publicId }.
// Para imágenes de publicaciones se requiere identidad verificada.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const image: unknown = body?.image;
  const folder = ["verification", "avatars"].includes(body?.folder)
    ? body.folder
    : "listings";

  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Imagen inválida" }, { status: 400 });
  }

  // Las fotos de publicaciones requieren identidad verificada (avatars/verification no)
  if (folder === "listings") {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { verification: true },
    });
    if (dbUser?.verification !== "VERIFIED") {
      return NextResponse.json(
        { error: "Verificá tu identidad para subir fotos." },
        { status: 403 }
      );
    }
  }

  try {
    const result = await uploadImage(image, folder);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "No se pudo subir la imagen." }, { status: 500 });
  }
}
