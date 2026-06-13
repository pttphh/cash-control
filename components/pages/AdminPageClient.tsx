"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile, UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "관리자" },
  { value: "jibgye", label: "집계" },
  { value: "sales", label: "영업" },
];

export default function AdminPageClient() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "sales" as UserRole,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setError("사용자 목록을 불러올 수 없습니다.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "계정 생성에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    setForm({ email: "", password: "", name: "", role: "sales" });
    loadUsers();
    setSubmitting(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 계정을 삭제하시겠습니까?`)) return;

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "삭제에 실패했습니다.");
      return;
    }
    loadUsers();
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-6">관리자 — 회원 관리</h2>

      {error && (
        <p className="text-danger text-sm bg-red-50 p-3 rounded-md mb-4">{error}</p>
      )}

      <form onSubmit={handleCreate} className="summary-card mb-8 space-y-4">
        <h3 className="font-medium">신규 계정 생성</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">역할</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as UserRole })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
              minLength={6}
            />
          </div>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "생성 중..." : "계정 생성"}
        </button>
      </form>

      <h3 className="font-medium mb-3">등록된 사용자</h3>
      {loading ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>역할</th>
              <th>가입일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="capitalize">{u.role}</td>
                <td>{new Date(u.created_at).toLocaleDateString("ko-KR")}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id, u.name)}
                    className="text-danger text-sm hover:underline"
                  >
                    탈퇴
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
