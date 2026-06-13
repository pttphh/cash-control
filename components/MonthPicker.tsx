"use client";

import { shiftYearMonth, formatYearMonth } from "@/lib/utils";
import { useMonth } from "@/context/MonthContext";

export default function MonthPicker() {
  const { yearMonth, setYearMonth } = useMonth();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setYearMonth(shiftYearMonth(yearMonth, -1))}
        className="btn-outline px-3 py-1 text-sm"
        aria-label="전월"
      >
        ←
      </button>
      <span className="text-lg font-semibold min-w-[120px] text-center">
        {formatYearMonth(yearMonth)}
      </span>
      <button
        type="button"
        onClick={() => setYearMonth(shiftYearMonth(yearMonth, 1))}
        className="btn-outline px-3 py-1 text-sm"
        aria-label="다음월"
      >
        →
      </button>
    </div>
  );
}
