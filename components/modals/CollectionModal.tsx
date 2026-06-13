"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, toYearMonth } from "@/lib/utils";
import { getClientOutstandingAtMonthStart } from "@/lib/outstanding";
import { calcClientB, getVaultForRole } from "@/lib/business";
import type { UserRole } from "@/lib/types";

interface CollectionModalProps {
  yearMonth: string;
  userId: string;
  userRole: UserRole;
  onClose: () => void;
  onSaved: () => void;
}

export default function CollectionModal({
  yearMonth,
  userId,
  userRole,
  onClose,
  onSaved,
}: CollectionModalProps) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [clientId, setClientId] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [prevOutstanding, setPrevOutstanding] = useState(0);
  const [monthB, setMonthB] = useState(0);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remaining = prevOutstanding + monthB - amount;

  useEffect(() => {
    async function loadClients() {
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      setClients(data ?? []);
    }
    loadClients();
  }, []);

  useEffect(() => {
    if (!clientId) {
      setPrevOutstanding(0);
      setMonthB(0);
      return;
    }

    async function loadOutstanding() {
      const supabase = createClient();

      const prev = await getClientOutstandingAtMonthStart(clientId, yearMonth);
      setPrevOutstanding(prev);

      const { data: curShipments } = await supabase
        .from("shipments")
        .select("*")
        .eq("client_id", clientId)
        .eq("year_month", yearMonth);

      const { data: curIssuances } = await supabase
        .from("issuances")
        .select("*")
        .eq("client_id", clientId)
        .eq("year_month", yearMonth);

      setMonthB(calcClientB(curShipments ?? [], curIssuances ?? [], clientId));
    }

    loadOutstanding();
  }, [clientId, yearMonth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      setError("거래처를 선택하세요.");
      return;
    }
    if (!entryDate) {
      setError("수금 날짜를 입력하세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("collections").insert({
        client_id: clientId,
        amount,
        vault: getVaultForRole(userRole),
        entry_date: entryDate,
        year_month: toYearMonth(entryDate) || yearMonth,
        created_by: userId,
      });
      if (insertError) throw insertError;
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">신규 수금 입력</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <p className="text-danger text-sm bg-red-50 p-2 rounded">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">거래처</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">선택하세요</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">수금 날짜</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">전월 미수금 (자동)</label>
            <input
              type="text"
              readOnly
              value={formatCurrency(prevOutstanding)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">당월 B (출고-발행)</label>
            <input
              type="text"
              readOnly
              value={formatCurrency(monthB)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이번 수금액</label>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              min={0}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">잔여 미수금 (자동)</label>
            <input
              type="text"
              readOnly
              value={formatCurrency(remaining)}
              className={`w-full border rounded-md px-3 py-2 bg-gray-50 ${
                remaining <= 0 ? "text-success" : "text-danger"
              }`}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
