import { requireAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MonthPicker from "@/components/MonthPicker";
import LogoutButton from "@/components/LogoutButton";
import { MonthProvider } from "@/context/MonthContext";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();

  return (
    <MonthProvider>
      <div className="flex min-h-screen">
        <Sidebar role={profile.role} userName={profile.name} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
            <MonthPicker />
            <LogoutButton />
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </MonthProvider>
  );
}
