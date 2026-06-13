"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SHIPMENT_ITEMS } from "@/lib/utils";
import type { ShipmentItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toYearMonth } from "@/lib/utils";

interface ShipmentModalProps {
  yearMonth: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ShipmentModal({
  yearMonth,
  userId,
  onClose,
  onSaved,
}: ShipmentModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [item, setItem] = useState<ShipmentItem>("학18");

  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [shipmentDate, setShipmentDate] = useState("");
  const [shipmentQty, setShipmentQty] = useState(0);
  const [shipmentAmount, setShipmentAmount] = useState(0);

  const [issuanceOpen, setIssuanceOpen] = useState(false);
  const [issuanceDate, setIssuanceDate] = useState("");
  const [issuanceQty, setIssuanceQty] = useState(0);
  const [issuanceAmount, setIssuanceAmount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalShipment = shipmentOpen ? shipmentAmount : 0;
  const totalIssuance = issuanceOpen ? issuanceAmount : 0;
  const totalB = totalShipment - totalIssuance;

  async function searchClients(query: string) {
    setClientName(query);
    setSelectedClientId(null);
    if (query.length < 1) {
      setClientSuggestions([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .ilike("name", `%${query}%`)
      .limit(10);
    setClientSuggestions(data ?? []);
  }

  function selectClient(id: string, name: string) {
    setSelectedClientId(id);
    setClientName(name);
    setClientSuggestions([]);
  }

  async function resolveClientId(): Promise<string> {
    if (selectedClientId) return selectedClientId;

    const supabase = createClient();
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("name", clientName.trim())
      .single();

    if (existing) return existing.id;

    const { data: created, error: createError } = await supabase
      .from("clients")
      .insert({ name: clientName.trim() })
      .select("id")
      .single();

    if (createError) throw createError;
    return created.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError("거래처명을 입력하세요.");
      return;
    }
    if (!shipmentOpen && !issuanceOpen) {
      setError("출고 또는 발행 기입을 선택하세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const clientId = await resolveClientId();

      if (shipmentOpen) {
        const { error: shipError } = await supabase.from("shipments").insert({
          client_id: clientId,
          item,
          quantity: shipmentQty,
          amount: shipmentAmount,
          entry_date: shipmentDate,
          year_month: toYearMonth(shipmentDate) || yearMonth,
          created_by: userId,
        });
        if (shipError) throw shipError;
      }

      if (issuanceOpen) {
        const { error: issError } = await supabase.from("issuances").insert({
          client_id: clientId,
          quantity: issuanceQty,
          amount: issuanceAmount,
          entry_date: issuanceDate,
          year_month: toYearMonth(issuanceDate) || yearMonth,
          created_by: userId,
        });
        if (issError) throw issError;
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function toggleShipment() {
    if (shipmentOpen) {
      setShipmentDate("");
      setShipmentQty(0);
      setShipmentAmount(0);
    }
    setShipmentOpen(!shipmentOpen);
  }

  function toggleIssuance() {
    if (issuanceOpen) {
      setIssuanceDate("");
      setIssuanceQty(0);
      setIssuanceAmount(0);
    }
    setIssuanceOpen(!issuanceOpen);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">신규 출고/발행 입력</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {error && (
              <p className="text-danger text-sm bg-red-50 p-2 rounded">{error}</p>
            )}

            <div className="relative">
              <label className="block text-sm font-medium mb-1">거래처명</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => searchClients(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="거래처 검색 또는 신규 등록"
              />
              {clientSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                  {clientSuggestions.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => selectClient(c.id, c.name)}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">품목</label>
              <div className="flex gap-2 flex-wrap">
                {SHIPMENT_ITEMS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setItem(i)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      item === i
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <button
                type="button"
                onClick={toggleShipment}
                className={`w-full py-2 rounded-md text-sm font-medium ${
                  shipmentOpen ? "btn-danger" : "btn-primary"
                }`}
              >
                {shipmentOpen ? "출고 기입 삭제" : "출고 기입"}
              </button>
              {shipmentOpen && (
                <div className="mt-3 space-y-2">
                  <input
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                  <input
                    type="number"
                    placeholder="수량"
                    value={shipmentQty || ""}
                    onChange={(e) => setShipmentQty(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min={0}
                  />
                  <input
                    type="number"
                    placeholder="출고 금액"
                    value={shipmentAmount || ""}
                    onChange={(e) => setShipmentAmount(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min={0}
                    required
                  />
                </div>
              )}
            </div>

            <div className="border rounded-md p-3">
              <button
                type="button"
                onClick={toggleIssuance}
                className={`w-full py-2 rounded-md text-sm font-medium ${
                  issuanceOpen ? "btn-danger" : "btn-primary"
                }`}
              >
                {issuanceOpen ? "발행 기입 삭제" : "발행 기입"}
              </button>
              {issuanceOpen && (
                <div className="mt-3 space-y-2">
                  <input
                    type="date"
                    value={issuanceDate}
                    onChange={(e) => setIssuanceDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                  <input
                    type="number"
                    placeholder="발행 수량"
                    value={issuanceQty || ""}
                    onChange={(e) => setIssuanceQty(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min={0}
                  />
                  <input
                    type="number"
                    placeholder="발행 금액"
                    value={issuanceAmount || ""}
                    onChange={(e) => setIssuanceAmount(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min={0}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-4 bg-gray-50 space-y-2">
            <div className="flex justify-between text-sm">
              <span>총 출고액</span>
              <span className="font-semibold text-primary">{formatCurrency(totalShipment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>총 발행액</span>
              <span className="font-semibold">{formatCurrency(totalIssuance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>B (출고 - 발행)</span>
              <span className="font-semibold">{formatCurrency(totalB)}</span>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
