import type {
  Shipment,
  Issuance,
  Collection,
  Withdrawal,
  ClientReportRow,
} from "./types";
import { isCategoryA } from "./utils";

export function calcClientB(
  shipments: Shipment[],
  issuances: Issuance[],
  clientId: string
): number {
  const shipmentTotal = shipments
    .filter((s) => s.client_id === clientId)
    .reduce((sum, s) => sum + s.amount, 0);
  const issuanceTotal = issuances
    .filter((i) => i.client_id === clientId)
    .reduce((sum, i) => sum + i.amount, 0);
  return shipmentTotal - issuanceTotal;
}

export function calcMonthTotals(
  shipments: Shipment[],
  issuances: Issuance[]
) {
  const totalShipment = shipments.reduce((sum, s) => sum + s.amount, 0);
  const totalIssuance = issuances.reduce((sum, i) => sum + i.amount, 0);
  const totalB = totalShipment - totalIssuance;

  const categoryA = shipments
    .filter((s) => isCategoryA(s.item))
    .reduce((sum, s) => sum + s.amount, 0);
  const categoryB = totalShipment - categoryA;

  return { totalShipment, totalIssuance, totalB, categoryA, categoryB };
}

export function calcClientRemaining(
  prevOutstanding: number,
  monthB: number,
  collectionsTotal: number
): number {
  return prevOutstanding + monthB - collectionsTotal;
}

export function calcVaultBalance(
  collections: Collection[],
  withdrawals: Withdrawal[],
  vault: "A" | "B"
): { totalIn: number; totalOut: number; balance: number } {
  const totalIn = collections
    .filter((c) => c.vault === vault)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalOut = withdrawals.reduce((sum, w) => {
    return sum + (vault === "A" ? w.amount_a : w.amount_b);
  }, 0);

  return { totalIn, totalOut, balance: totalIn - totalOut };
}

export function getWithdrawalDisplayAmount(w: Withdrawal): number {
  if (w.vault === "AB") return w.amount_a + w.amount_b;
  if (w.vault === "A") return w.amount_a;
  return w.amount_b;
}

export function buildClientReportRows(
  clientIds: { id: string; name: string }[],
  shipments: Shipment[],
  issuances: Issuance[],
  collections: Collection[],
  prevOutstandingMap: Map<string, number>
): ClientReportRow[] {
  return clientIds.map(({ id, name }) => {
    const shipment_total = shipments
      .filter((s) => s.client_id === id)
      .reduce((sum, s) => sum + s.amount, 0);
    const issuance_total = issuances
      .filter((i) => i.client_id === id)
      .reduce((sum, i) => sum + i.amount, 0);
    const b = shipment_total - issuance_total;
    const collection_total = collections
      .filter((c) => c.client_id === id)
      .reduce((sum, c) => sum + c.amount, 0);
    const prev = prevOutstandingMap.get(id) ?? 0;
    const remaining = prev + b - collection_total;

    return {
      client_id: id,
      client_name: name,
      shipment_total,
      issuance_total,
      b,
      collection_total,
      remaining,
    };
  });
}

export function getVaultForRole(role: string): "A" | "B" {
  return role === "sales" ? "A" : "B";
}
