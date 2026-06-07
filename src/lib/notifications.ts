import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Crea una notificación in-app. Nunca lanza (no debe romper la acción que la dispara).
 * Dedupe: si ya hay una NO leída con el mismo link, la actualiza en vez de duplicar.
 */
export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  try {
    if (params.link) {
      const existing = await prisma.notification.findFirst({
        where: { userId: params.userId, link: params.link, readAt: null },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        await prisma.notification.update({
          where: { id: existing.id },
          data: {
            type: params.type,
            title: params.title,
            body: params.body ?? null,
            createdAt: new Date(),
          },
        });
        return;
      }
    }
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
      },
    });
  } catch (e) {
    console.error("notify error:", e);
  }
}
