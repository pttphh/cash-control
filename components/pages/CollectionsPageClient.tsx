"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMonth } from "@/context/MonthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcClientB } from "@/lib/business";
import { getClientOutstandingAtMonthStart } from "@/lib/outstanding";
import CollectionModal from "@/components/modals/CollectionModal";
import type { Collection, CollectionRow, UserRole } from "@/lib/types";

interface CollectionsPageProps {
  userId: string;
  userRole: UserRole;
  isAdmin: boolean;
}

export default function CollectionsPageClient({
  userId,
  userRole,
  isAdmin,
}: CollectionsPageProps) {
  const { yearMonth } = useMonth();
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [summary, setSummary] = useState({
    prevTotal: 0,
    collectionTotal: 0,
    remainingTotal: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: collections } = await supabase
      .from("collections")
      .select("*, clients(name), profiles(name)")
      .eq("year_month", yearMonth)
      .order("entry_date", { ascending: true });

    const clientIds = Array.from(
      new Set((collections ?? []).map((c) => c.client_id))
    );

    const clientData = await Promise.all(
      clientIds.map(async (clientId) => {
        const prevOutstanding = await getClientOutstandingAtMonthStart(
          clientId,
          yearMonth
        );

        const { data: shipments } = await supabase
          .from("shipments")
          .select("*")
          .eq("client_id", clientId)
          .eq("year_month", yearMonth);

        const { data: issuances } = await supabase
          .from("issuances")
          .select("*")
          .eq("client_id", clientId)
          .eq("year_month", yearMonth);

        const monthB = calcClientB(shipments ?? [], issuances ?? [], clientId);
        return { clientId, prevOutstanding, monthB };
      })
    );

    const clientMap = new Map(clientData.map((d) => [d.clientId, d]));

    const collectionRows: CollectionRow[] = [];
    const clientCumulative = new Map<string, number>();

    for (const c of collections ?? []) {
      const coll = c as Collection & {
        clients: { name: string };
        profiles: { name: string } | null;
      };
      const info = clientMap.get(coll.client_id);
      const prev = info?.prevOutstanding ?? 0;
      const monthB = info?.monthB ?? 0;
      const prevCum = clientCumulative.get(coll.client_id) ?? 0;
      const newCum = prevCum + coll.amount;
      clientCumulative.set(coll.client_id, newCum);
      const remaining = prev + monthB - newCum;

      collectionRows.push({
        id: coll.id,
        client_id: coll.client_id,
        client_name: coll.clients?.name ?? "",
        entry_date: coll.entry_date,
        prev_outstanding: prev,
        amount: coll.amount,
        remaining,
        status: remaining <= 0 ? "완납" : "미수금",
        created_by_name: coll.profiles?.name ?? "-",
      });
    }

    collectionRows.sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );

    const prevTotal = clientData.reduce((s, d) => s + d.prevOutstanding, 0);
    const collectionTotal = (collections ?? []).reduce(
      (s, c) => s + c.amount,
      0
    );
    const monthBTotal = clientData.reduce((s, d) => s + d.monthB, 0);
    const remainingTotal = prevTotal + monthBTotal - collectionTotal;

    setRows(collectionRows);
    setSummary({ prevTotal, collectionTotal, remainingTotal });
    setLoading(false);
  }, [yearMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(id: string) {
    if (!isAdmin || !confirm("삭제하시겠습니까?")) return;
    const supabase = createClient();
    await supabase.from("collections").delete().eq("id", id);
    loadData();
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="summary-card">
            <p className="text-sm text-gray-500">전월 미수금 합계</p>
            <p className="text-xl font-bold">{formatCurrency(summary.prevTotal)}</p>
          </div>
          <div className="summary-card">
            <p className="text-sm text-gray-500">이번 달 수금 합계</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(summary.collectionTotal)}
            </p>
          </div>
          <div className="summary-card">
            <p className="text-sm text-gray-500">잔여 미수금</p>
            <p
              className={`text-xl font-bold ${
                summary.remainingTotal <= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatCurrency(summary.remainingTotal)}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
          신규 수금 입력
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">불러오는 중...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>거래처</th>
                <th>날짜</th>
                <th>전월 미수금</th>
                <th>수금액</th>
                <th>잔여 미수금</th>
                <th>수금 상태</th>
                <th>기입자</th>
                {isAdmin && <th>관리</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center text-gray-400 py-8">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.client_name}</td>
                    <td>{formatDate(row.entry_date)}</td>
                    <td className="text-right">{formatCurrency(row.prev_outstanding)}</td>
                    <td className="text-right">{formatCurrency(row.amount)}</td>
                    <td className="text-right">{formatCurrency(row.remaining)}</td>
                    <td>
                      <span
                        className={
                          row.status === "완납" ? "text-success" : "text-danger"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{row.created_by_name}</td>
                    {isAdmin && (
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="text-danger text-sm hover:underline"
                        >
                          삭제
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CollectionModal
          yearMonth={yearMonth}
          userId={userId}
          userRole={userRole}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
