"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMonth } from "@/context/MonthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calcMonthTotals } from "@/lib/business";
import ShipmentModal from "@/components/modals/ShipmentModal";
import type { Shipment, Issuance, ShipmentRow } from "@/lib/types";

interface ShipmentsPageProps {
  userId: string;
  isAdmin: boolean;
}

export default function ShipmentsPageClient({
  userId,
  isAdmin,
}: ShipmentsPageProps) {
  const { yearMonth } = useMonth();
  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [totals, setTotals] = useState({ totalShipment: 0, totalIssuance: 0, totalB: 0 });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: shipments } = await supabase
      .from("shipments")
      .select("*, clients(name), profiles(name)")
      .eq("year_month", yearMonth)
      .order("entry_date", { ascending: false });

    const { data: issuances } = await supabase
      .from("issuances")
      .select("*, clients(name), profiles(name)")
      .eq("year_month", yearMonth)
      .order("entry_date", { ascending: false });

    const shipmentRows: ShipmentRow[] = (shipments ?? []).map((s: Shipment & { clients: { name: string }; profiles: { name: string } | null }) => ({
      id: s.id,
      type: "shipment" as const,
      client_id: s.client_id,
      client_name: s.clients?.name ?? "",
      item: s.item,
      shipment_amount: s.amount,
      issuance_amount: 0,
      b: s.amount,
      created_by_name: s.profiles?.name ?? "-",
    }));

    const issuanceRows: ShipmentRow[] = (issuances ?? []).map((i: Issuance & { clients: { name: string }; profiles: { name: string } | null }) => ({
      id: i.id,
      type: "issuance" as const,
      client_id: i.client_id,
      client_name: i.clients?.name ?? "",
      item: "-",
      shipment_amount: 0,
      issuance_amount: i.amount,
      b: -i.amount,
      created_by_name: i.profiles?.name ?? "-",
    }));

    const allRows = [...shipmentRows, ...issuanceRows].sort(
      (a, b) => a.client_name.localeCompare(b.client_name)
    );

    setRows(allRows);
    setTotals(calcMonthTotals(shipments ?? [], issuances ?? []));
    setLoading(false);
  }, [yearMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(id: string, type: "shipment" | "issuance") {
    if (!isAdmin || !confirm("삭제하시겠습니까?")) return;
    const supabase = createClient();
    const table = type === "shipment" ? "shipments" : "issuances";
    await supabase.from(table).delete().eq("id", id);
    loadData();
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="summary-card">
            <p className="text-sm text-gray-500">총 출고액</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(totals.totalShipment)}
            </p>
          </div>
          <div className="summary-card">
            <p className="text-sm text-gray-500">총 발행액</p>
            <p className="text-xl font-bold">{formatCurrency(totals.totalIssuance)}</p>
          </div>
          <div className="summary-card">
            <p className="text-sm text-gray-500">총 B</p>
            <p className="text-xl font-bold">{formatCurrency(totals.totalB)}</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
          신규 입력
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
                <th>품목</th>
                <th>출고액</th>
                <th>발행액</th>
                <th>B</th>
                <th>기입자</th>
                {isAdmin && <th>관리</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center text-gray-400 py-8">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.type}-${row.id}`}>
                    <td>{row.client_name}</td>
                    <td>{row.item}</td>
                    <td className="text-right">
                      {row.shipment_amount ? formatCurrency(row.shipment_amount) : "-"}
                    </td>
                    <td className="text-right">
                      {row.issuance_amount ? formatCurrency(row.issuance_amount) : "-"}
                    </td>
                    <td className="text-right">{formatCurrency(row.b)}</td>
                    <td>{row.created_by_name}</td>
                    {isAdmin && (
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id, row.type)}
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
        <ShipmentModal
          yearMonth={yearMonth}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
