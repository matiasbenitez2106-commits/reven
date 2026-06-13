import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyAdmin, escapeHtml } from "@/lib/email";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  topic: z.enum(["SOPORTE", "PRIVACIDAD", "DENUNCIA", "OTRO"]).default("SOPORTE"),
  message: z.string().trim().min(10).max(2000),
});

const TOPIC_LABEL: Record<string, string> = {
  SOPORTE: "Soporte",
  PRIVACIDAD: "Privacidad",
  DENUNCIA: "Denuncia",
  OTRO: "Otro",
};

// Mensaje de contacto/soporte/privacidad. Queda en el panel de admin y avisa por email.
export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "support", RATE_LIMITS.report);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisá los datos del formulario." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const { name, email, topic, message } = parsed.data;

  await prisma.supportMessage.create({
    data: { name, email, topic, message, userId: user?.id ?? null },
  });

  await notifyAdmin(
    `📨 ${TOPIC_LABEL[topic]}: nuevo mensaje de contacto`,
    `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) escribió por <strong>${TOPIC_LABEL[topic]}</strong>:</p>
     <p style="border-left:3px solid #66785B;padding:8px 12px;color:#444;background:#f6f6f6;border-radius:4px">${escapeHtml(message)}</p>
     <p>Lo ves en el panel: /admin/soporte</p>`
  );

  return NextResponse.json({ ok: true });
}
