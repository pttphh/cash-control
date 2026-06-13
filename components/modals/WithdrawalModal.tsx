"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, toYearMonth } from "@/lib/utils";
import type { WithdrawalType } from "@/lib/types";

interface WithdrawalModalProps {
  yearMonth: string;
  userId: string;
  balanceA: number;
  balanceB: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function WithdrawalModal({
  yearMonth,
  userId,
  balanceA,
  balanceB,
  onClose,
  onSaved,
}: WithdrawalModalProps) {
  const [type, setType] = useState<WithdrawalType>("중간");
  const [vault, setVault] = useState<"A" | "B">("A");
  const [amount, setAmount] = useState(0);
  const [entryDate, setEntryDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFinal = type === "최종";
  const finalAmountA = balanceA;
  const finalAmountB = balanceB;

  const currentBalance = vault === "A" ? balanceA : balanceB;
  const withdrawAmount = isFinal ? 0 : amount;
  const afterBalance = isFinal
    ? 0
    : currentBalance - withdrawAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entryDate) {
      setError("날짜를 입력하세요.");
      return;
    }
    if (!isFinal && amount <= 0) {
      setError("출금액을 입력하세요.");
      return;
    }
    if (!isFinal && amount > currentBalance) {
      setError("잔액을 초과할 수 없습니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (isFinal) {
        const { error: insertError } = await supabase.from("withdrawals").insert({
          type: "최종",
          vault: "AB",
          amount_a: finalAmountA,
          amount_b: finalAmountB,
          note: note || null,
          entry_date: entryDate,
          year_month: toYearMonth(entryDate) || yearMonth,
          created_by: userId,
        });
        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase.from("withdrawals").insert({
          type: "중간",
          vault,
          amount_a: vault === "A" ? amount : 0,
          amount_b: vault === "B" ? amount : 0,
          note: note || null,
          entry_date: entryDate,
          year_month: toYearMonth(entryDate) || yearMonth,
          created_by: userId,
        });
        if (insertError) throw insertError;
      }
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
          <h2 className="text-lg font-semibold">출금</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <p className="text-danger text-sm bg-red-50 p-2 rounded">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">구분</label>
            <div className="flex gap-2">
              {(["중간", "최종"] as WithdrawalType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-md text-sm border ${
                    type === t
                      ? "bg-primary text-white border-primary"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {t} 출금
                </button>
              ))}
            </div>
          </div>

          {!isFinal && (
            <div>
              <label className="block text-sm font-medium mb-2">금고 선택</label>
              <div className="flex gap-2">
                {(["A", "B"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVault(v)}
                    className={`flex-1 py-2 rounded-md text-sm border ${
                      vault === v
                        ? v === "A"
                          ? "bg-vault-a text-white border-vault-a"
                          : "bg-vault-b text-white border-vault-b"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    금고 {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isFinal && (
            <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
              <p className="font-medium">금고 A·B 전액 출금 (자동)</p>
              <div className="flex justify-between">
                <span className="text-vault-a">금고 A</span>
                <span>{formatCurrency(finalAmountA)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-vault-b">금고 B</span>
                <span>{formatCurrency(finalAmountB)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">날짜</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          {!isFinal && (
            <div>
              <label className="block text-sm font-medium mb-1">출금액</label>
              <input
                type="number"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min={0}
                max={currentBalance}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">비고 (선택)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            {isFinal ? (
              <>
                <div className="flex justify-between">
                  <span>출금 후 금고 A 잔액</span>
                  <span className="font-semibold">₩0</span>
                </div>
                <div className="flex justify-between">
                  <span>출금 후 금고 B 잔액</span>
                  <span className="font-semibold">₩0</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>현재 잔액</span>
                  <span>{formatCurrency(currentBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>출금 후 잔액</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(afterBalance)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "저장 중..." : "출금"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
