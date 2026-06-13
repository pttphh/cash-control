"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const router = useRouter();
  const visibleItems = MENU_ITEMS.filter((item) => item.roles.includes(role));

  const [menuOpen, setMenuOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handlePasswordChange() {
    setMessage("");
    if (!newPw || !confirmPw) { setMessage("새 비밀번호를 입력하세요."); return; }
    if (newPw !== confirmPw) { setMessage("새 비밀번호가 일치하지 않습니다."); return; }
    if (newPw.length < 6) { setMessage("비밀번호는 6자 이상이어야 합니다."); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      setMessage("변경 실패: " + error.message);
    } else {
      setMessage("비밀번호가 변경되었습니다.");
      setTimeout(() => { setPwModalOpen(false); setNewPw(""); setConfirmPw(""); setMessage(""); }, 1500);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "삭제") { setMessage("'삭제'를 정확히 입력하세요."); return; }
    const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
    if (res.ok) { router.push("/"); }
    else { setMessage("계정 삭제 실패. 관리자에게 문의하세요."); }
  }

  return (
    <>
      <aside className="w-56 min-h-screen bg-sidebar border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200" ref={menuRef}>
          <h1 className="text-lg font-bold text-primary">매출·수금 관리</h1>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="mt-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <p className="text-sm font-medium text-gray-700">{userName}</p>
            <p className="text-xs text-gray-400 capitalize">{role}</p>
          </button>
          {menuOpen && (
            <div className="mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button type="button" onClick={() => { setMenuOpen(false); setPwModalOpen(true); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                비밀번호 변경
              </button>
              <button type="button" onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                로그아웃
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); setDeleteModalOpen(true); }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                계정 삭제
              </button>
            </div>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-200"
                }`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {pwModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h2 className="text-base font-semibold mb-4">비밀번호 변경</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">새 비밀번호</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="6자 이상" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">새 비밀번호 확인</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="다시 입력" />
              </div>
              {message && <p className={`text-xs ${message.includes("변경되었습니다") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => { setPwModalOpen(false); setNewPw(""); setConfirmPw(""); setMessage(""); }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">취소</button>
              <button type="button" onClick={handlePasswordChange}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:opacity-90">변경</button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h2 className="text-base font-semibold mb-2">계정 삭제</h2>
            <p className="text-sm text-gray-500 mb-4">
              계정을 삭제하면 복구할 수 없습니다.<br />
              확인하려면 <strong>삭제</strong>를 입력하세요.
            </p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3" placeholder="삭제" />
            {message && <p className="text-xs text-red-500 mb-2">{message}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setDeleteModalOpen(false); setDeleteConfirm(""); setMessage(""); }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">취소</button>
              <button type="button" onClick={handleDeleteAccount}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}