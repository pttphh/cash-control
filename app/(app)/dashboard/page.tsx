import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await requireAuth();
  redirect("/shipments");
}
