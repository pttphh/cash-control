import { requireAdmin } from "@/lib/auth";
import AdminPageClient from "@/components/pages/AdminPageClient";

export default async function AdminPage() {
  await requireAdmin();
  return <AdminPageClient />;
}
