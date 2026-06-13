import { requireAuth } from "@/lib/auth";
import CollectionsPageClient from "@/components/pages/CollectionsPageClient";

export default async function CollectionsPage() {
  const profile = await requireAuth();

  return (
    <CollectionsPageClient
      userId={profile.id}
      userRole={profile.role}
      isAdmin={profile.role === "admin"}
    />
  );
}
