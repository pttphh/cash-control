"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

interface MenuItem {
  href: string;
  label: string;
  roles: UserRole[];
}

const MENU_ITEMS: MenuItem[] = [
  { href: "/shipments", label: "출고 기입", roles: ["admin", "jibgye", "sales"] },
  { href: "/collections", label: "수금 기입", roles: ["admin", "jibgye", "sales"] },
  { href: "/vault", label: "금고 관리", roles: ["admin", "jibgye"] },
  { href: "/report", label: "월별 조회 / 보고서", roles: ["admin", "jibgye"] },
  { href: "/admin", label: "관리자", roles: ["admin"] },
];

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const visibleItems = MENU_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-56 min-h-screen bg-sidebar border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-primary">매출·수금 관리</h1>
        <p className="text-sm text-gray-600 mt-1">{userName}</p>
        <p className="text-xs text-gray-400 capitalize">{role}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
