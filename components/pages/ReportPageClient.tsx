"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMonth } from "@/context/MonthContext";
import {
  formatCurrency,
  formatDate,
  formatPrintDate,
  formatYearMonth,
} from "@/lib/utils";
import { calcMonthTotals, getWithdrawalDisplayAmount } from "@/lib/business";
import { getAllClientsOutstandingMap } from "@/lib/outstanding";
import { buildClientReportRows } from "@/lib/business";
import type {
  Shipment,
  Issuance,
  Collection,
  Withdrawal,
  Client,
} from "@/lib/types";

export default function ReportPageClient() {
  const { yearMonth } = useMonth();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [issuances, setIssuances] = useState<Issuance[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [prevMap, setPrevMap] = useState<Map<string, number>>(new Map());

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [
      { data: s },
      { data: i },
      { data: c },
      { data: w },
      { data: cl },
    ] = await Promise.all([
      supabase.from("shipments").select("*").eq("year_month", yearMonth),
      supabase.from("issuances").select("*").eq("year_month", yearMonth),
      supabase.from("collections").select("*").eq("year_month", yearMonth),
      supabase
        .from("withdrawals")
        .select("*")
        .eq("year_month", yearMonth)
        .order("entry_date"),
      supabase.from("clients").select("*").order("name"),
    ]);

    setShipments(s ?? []);
    setIssuances(i ?? []);
    setCollections(c ?? []);
    setWithdrawals(w ?? []);
    setClients(cl ?? []);

    const clientIds = (cl ?? []).map((x) => x.id);
    const outstanding = await getAllClientsOutstandingMap(clientIds, yearMonth);
    setPrevMap(outstanding);
    setLoading(false);
  }, [yearMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totals = calcMonthTotals(shipments, issuances);
  const collectionTotal = collections.reduce((sum, c) => sum + c.amount, 0);
  const midWithdrawals = withdrawals
    .filter((w) => w.type === "중간")
    .reduce((sum, w) => sum + getWithdrawalDisplayAmount(w), 0);
  const finalWithdrawals = withdrawals
    .filter((w) => w.type === "최종")
    .reduce((sum, w) => sum + getWithdrawalDisplayAmount(w), 0);

  const prevOutstandingTotal = [...prevMap.values()].reduce((s, v) => s + v, 0);
  const totalRemaining =
    prevOutstandingTotal + totals.totalB - collectionTotal;

  const clientRows = buildClientReportRows(
    clients.map((c) => ({ id: c.id, name: c.name })),
    shipments,
    issuances,
    collections,
    prevMap
  ).filter(
    (r) =>
      r.shipment_total > 0 ||
      r.issuance_total > 0 ||
      r.collection_total > 0 ||
      r.remaining !== 0
  );

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return <p className="text-gray-500">불러오는 중...</p>;
  }

  return (
    <div>
      <div className="no-print flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">월별 조회 / 보고서</h2>
        <button type="button" onClick={handlePrint} className="btn-primary">
          인쇄
        </button>
      </div>

      <div className="print-area mx-auto bg-white">
        <h1 className="text-xl font-bold text-center mb-1">월별 매출·수금 현황</h1>
        <p className="text-center text-sm mb-4">
          {formatYearMonth(yearMonth)} | 출력일: {formatPrintDate()}
        </p>
        <hr className="border-gray-400 mb-4" />

        <div className="grid grid-cols-2 gap-4 mb-6 border border-gray-400">
          <div className="p-3 border-r border-gray-400">
            <h3 className="font-semibold mb-2">출고 현황</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>[Total]</span>
                <span>{formatCurrency(totals.totalShipment)}</span>
              </div>
              <div className="flex justify-between">
                <span>[A]</span>
                <span>{formatCurrency(totals.categoryA)}</span>
              </div>
              <div className="flex justify-between">
                <span>[B]</span>
                <span>{formatCurrency(totals.categoryB)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>B = Total - A</span>
                <span>{formatCurrency(totals.categoryB)}</span>
              </div>
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold mb-2">수금 및 출금 현황</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>미수금</span>
                <span>{formatCurrency(totalRemaining)}</span>
              </div>
              <div className="flex justify-between">
                <span>수금액</span>
                <span>{formatCurrency(collectionTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>중간 출금</span>
                <span>{formatCurrency(midWithdrawals)}</span>
              </div>
              <div className="flex justify-between">
                <span>최종 출금</span>
                <span>{formatCurrency(finalWithdrawals)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>미수금 = B - 수금액</span>
                <span>{formatCurrency(totals.totalB - collectionTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="font-semibold mb-2">거래처별 현황</h3>
        <table className="data-table mb-6">
          <thead>
            <tr>
              <th>거래처</th>
              <th>출고액</th>
              <th>발행액</th>
              <th>B</th>
              <th>수금액</th>
              <th>잔여미수금</th>
            </tr>
          </thead>
          <tbody>
            {clientRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-4">
                  데이터 없음
                </td>
              </tr>
            ) : (
              clientRows.map((row) => (
                <tr key={row.client_id}>
                  <td>{row.client_name}</td>
                  <td className="text-right">{formatCurrency(row.shipment_total)}</td>
                  <td className="text-right">{formatCurrency(row.issuance_total)}</td>
                  <td className="text-right">{formatCurrency(row.b)}</td>
                  <td className="text-right">{formatCurrency(row.collection_total)}</td>
                  <td className="text-right">{formatCurrency(row.remaining)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h3 className="font-semibold mb-2">출금 현황</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>구분</th>
              <th>비고(선택)</th>
              <th>출금액</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4">
                  출금 내역 없음
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id}>
                  <td>{formatDate(w.entry_date)}</td>
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
    </div>
  );
}
