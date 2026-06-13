export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}년 ${month}월`;
}

export function formatDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatPrintDate(date: Date = new Date()): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [yearStr, monthStr] = yearMonth.split("-");
  const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1 + delta, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getPreviousYearMonth(yearMonth: string): string {
  return shiftYearMonth(yearMonth, -1);
}

export function toYearMonth(date: string): string {
  return date.slice(0, 7);
}

export const SHIPMENT_ITEMS = ["학18", "순옥18", "순콩18", "순카18"] as const;

/** 학18 = A 카테고리, 나머지 = B 카테고리 (보고서용) */
export function isCategoryA(item: string): boolean {
  return item === "학18";
}
