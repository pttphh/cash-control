import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export async function getProfileByUserId(
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data as Profile | null;
}
