import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BajaScreen } from "@/components/account/BajaScreen";

export const metadata = { title: "Cuenta en proceso de baja" };

export default async function BajaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  // Si la cuenta NO está en proceso de baja, no hay nada que ver acá.
  if (!user.deletionScheduledFor) redirect("/cuenta");

  return <BajaScreen deletionScheduledFor={user.deletionScheduledFor} />;
}
