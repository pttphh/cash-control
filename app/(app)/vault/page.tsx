import { requireRole } from "@/lib/auth";
import VaultPageClient from "@/components/pages/VaultPageClient";

export default async function VaultPage() {
  const profile = await requireRole(["admin", "jibgye"]);

  return (
    <VaultPageClient userId={profile.id} isAdmin={profile.role === "admin"} />
  );
}
