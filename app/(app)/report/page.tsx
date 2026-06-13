import { requireRole } from "@/lib/auth";
import ReportPageClient from "@/components/pages/ReportPageClient";

export default async function ReportPage() {
  await requireRole(["admin", "jibgye"]);
  return <ReportPageClient />;
}
