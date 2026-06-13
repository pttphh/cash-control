"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { getCurrentYearMonth } from "@/lib/utils";

interface MonthContextValue {
  yearMonth: string;
  setYearMonth: (ym: string) => void;
}

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth());

  return (
    <MonthContext.Provider value={{ yearMonth, setYearMonth }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error("useMonth must be used within MonthProvider");
  return ctx;
}
