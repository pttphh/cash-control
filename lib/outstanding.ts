import { createClient } from "@/lib/supabase/client";
import { calcClientB, calcClientRemaining } from "@/lib/business";
import { getPreviousYearMonth, shiftYearMonth } from "@/lib/utils";

export async function getClientOutstandingAtMonthStart(
  clientId: string,
  yearMonth: string
): Promise<number> {
  const supabase = createClient();
  let outstanding = 0;
  let current = "2000-01";

  while (current < yearMonth) {
    const { data: shipments } = await supabase
      .from("shipments")
      .select("*")
      .eq("client_id", clientId)
      .eq("year_month", current);

    const { data: issuances } = await supabase
      .from("issuances")
      .select("*")
      .eq("client_id", clientId)
      .eq("year_month", current);

    const { data: collections } = await supabase
      .from("collections")
      .select("*")
      .eq("client_id", clientId)
      .eq("year_month", current);

    const b = calcClientB(shipments ?? [], issuances ?? [], clientId);
    const coll = (collections ?? []).reduce((s, c) => s + c.amount, 0);
    outstanding = calcClientRemaining(outstanding, b, coll);
    current = shiftYearMonth(current, 1);
  }

  return outstanding;
}

export async function getAllClientsOutstandingMap(
  clientIds: string[],
  yearMonth: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  await Promise.all(
    clientIds.map(async (id) => {
      const val = await getClientOutstandingAtMonthStart(id, yearMonth);
      map.set(id, val);
    })
  );
  return map;
}

export { getPreviousYearMonth };
