import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/profile";
import type { Profile, UserRole } from "@/lib/types";
import { redirect } from "next/navigation";

export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return getProfileByUserId(user.id);
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?error=profile");
  return profile;
}

export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  return requireRole(["admin"]);
}
