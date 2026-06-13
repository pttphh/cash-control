"use client";

import { useRouter } from "next/navigation";

export default function ClearSessionButton() {
  const router = useRouter();

  async function handleClear() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      className="btn-outline w-full text-sm mt-2"
    >
      세션 초기화
    </button>
  );
}
