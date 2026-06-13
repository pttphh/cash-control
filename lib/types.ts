export type UserRole = "admin" | "jibgye" | "sales";

export type ShipmentItem = "학18" | "순옥18" | "순콩18" | "순카18";

export type VaultType = "A" | "B" | "AB";

export type WithdrawalType = "중간" | "최종";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  client_id: string;
  item: ShipmentItem;
  quantity: number;
  amount: number;
  entry_date: string;
  year_month: string;
  created_by: string | null;
  created_at: string;
  clients?: Client;
  profiles?: Profile;
}

export interface Issuance {
  id: string;
  client_id: string;
  quantity: number;
  amount: number;
  entry_date: string;
  year_month: string;
  created_by: string | null;
  created_at: string;
  clients?: Client;
  profiles?: Profile;
}

export interface Collection {
  id: string;
  client_id: string;
  amount: number;
  vault: "A" | "B";
  entry_date: string;
  year_month: string;
  created_by: string | null;
  created_at: string;
  clients?: Client;
  profiles?: Profile;
}

export interface Withdrawal {
  id: string;
  type: WithdrawalType;
  vault: VaultType;
  amount_a: number;
  amount_b: number;
  note: string | null;
  entry_date: string;
  year_month: string;
  created_by: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface ShipmentRow {
  id: string;
  type: "shipment" | "issuance";
  client_id: string;
  client_name: string;
  item: string;
  shipment_amount: number;
  issuance_amount: number;
  b: number;
  created_by_name: string;
}

export interface CollectionRow {
  id: string;
  client_id: string;
  client_name: string;
  entry_date: string;
  prev_outstanding: number;
  amount: number;
  remaining: number;
  status: "완납" | "미수금";
  created_by_name: string;
}

export interface ClientReportRow {
  client_id: string;
  client_name: string;
  shipment_total: number;
  issuance_total: number;
  b: number;
  collection_total: number;
  remaining: number;
}
