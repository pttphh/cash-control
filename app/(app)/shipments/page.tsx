import { requireAuth } from "@/lib/auth";
import ShipmentsPageClient from "@/components/pages/ShipmentsPageClient";

export default async function ShipmentsPage() {
  const profile = await requireAuth();

  return (
    <ShipmentsPageClient
      userId={profile.id}
      isAdmin={profile.role === "admin"}
    />
  );
}
