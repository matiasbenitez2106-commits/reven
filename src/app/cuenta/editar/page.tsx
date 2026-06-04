import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentDbUser } from "@/lib/auth";
import { EditProfileForm } from "@/components/account/EditProfileForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export const metadata = { title: "Editar perfil" };

export default async function EditAccountPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/ingresar");

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div>
        <Link href="/cuenta" className="text-sm text-gray-500 hover:text-brand-600">
          ← Mi cuenta
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar perfil</h1>
      </div>

      <EditProfileForm
        initial={{
          firstName: user.firstName,
          lastName: user.lastName,
          province: user.province,
          city: user.city,
          avatarUrl: user.avatarUrl,
        }}
      />
      <ChangePasswordForm />
    </div>
  );
}
