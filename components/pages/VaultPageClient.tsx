"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMonth } from "@/context/MonthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcVaultBalance, getWithdrawalDisplayAmount } from "@/lib/business";
import WithdrawalModal from "@/components/modals/WithdrawalModal";
import type { Collection, Withdrawal } from "@/lib/types";

interface VaultPageProps {
  userId: string;
  isAdmin: boolean;
}

export default function VaultPageClient({ userId, isAdmin }: VaultPageProps) {
  const { yearMonth } = useMonth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [{ data: allCollections }, { data: monthWithdrawals }, { data: totalWithdrawals }] =
      await Promise.all([
        supabase.from("collections").select("*"),
        supabase
          .from("withdrawals")
          .select("*")
          .eq("year_month", yearMonth)
          .order("entry_date", { ascending: false }),
        supabase.from("withdrawals").select("*"),
      ]);

    setCollections(allCollections ?? []);
    setWithdrawals(monthWithdrawals ?? []);
    setAllWithdrawals(totalWithdrawals ?? []);
    setSelected(new Set());
    setLoading(false);
  }, [yearMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const balanceAFull = calcVaultBalance(collections, allWithdrawals, "A");
  const balanceBFull = calcVaultBalance(collections, allWithdrawals, "B");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === withdrawals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(withdrawals.map((w) => w.id)));
    }
  }

  async function handleDeleteSelected() {
    if (!isAdmin || selected.size === 0) return;
    if (!confirm(`${selected.size}건을 삭제하시겠습니까?`)) return;
    const supabase = createClient();
    await supabase.from("withdrawals").delete().in("id", Array.from(selected));
    loadData();
  }

  function vaultLabel(v: string) {
    if (v === "AB") return "A·B";
    return v;
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
          출금
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="summary-card border-l-4 border-vault-a">
          <h3 className="text-lg font-semibold text-vault-a mb-3">금고 A</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">총 수금액</span>
              <span>{formatCurrency(balanceAFull.totalIn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">총 출금액</span>
              <span>{formatCurrency(balanceAFull.totalOut)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>잔액</span>
              <span className="text-vault-a">{formatCurrency(balanceAFull.balance)}</span>
            </div>
          </div>
        </div>

        <div className="summary-card border-l-4 border-vault-b">
          <h3 className="text-lg font-semibold text-vault-b mb-3">금고 B</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">총 수금액</span>
              <span>{formatCurrency(balanceBFull.totalIn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">총 출금액</span>
              <span>{formatCurrency(balanceBFull.totalOut)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>잔액</span>
              <span className="text-vault-b">{formatCurrency(balanceBFull.balance)}</span>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && selected.size > 0 && (
        <div className="mb-4">
          <button type="button" onClick={handleDeleteSelected} className="btn-danger text-sm">
            선택 삭제 ({selected.size})
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && (
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={withdrawals.length > 0 && selected.size === withdrawals.length}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                <th>날짜</th>
                <th>금고</th>
                <th>구분</th>
                <th>비고</th>
                <th>출금액</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center text-gray-400 py-8">
                    출금 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id}>
                    {isAdmin && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(w.id)}
                          onChange={() => toggleSelect(w.id)}
                        />
                      </td>
                    )}
                    <td>{formatDate(w.entry_date)}</td>
                    <td>{vaultLabel(w.vault)}</td>
                    <td>{w.type}</td>
                    <td>{w.note ?? "-"}</td>
                    <td className="text-right">
                      {formatCurrency(getWithdrawalDisplayAmount(w))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <WithdrawalModal
          yearMonth={yearMonth}
          userId={userId}
          balanceA={balanceAFull.balance}
          balanceB={balanceBFull.balance}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
