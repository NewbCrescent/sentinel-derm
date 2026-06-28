import { redirect } from "next/navigation";

import { createDashboardSupabaseClient } from "@/lib/supabase-server";
import type { DashboardAuthState, DashboardUser } from "@/types/auth";

type ProfileRole = {
  role: string | null;
};

function toDashboardUser(user: { id: string; email?: string }): DashboardUser {
  return {
    id: user.id,
    email: user.email ?? "Unknown email",
  };
}

export async function getDashboardAuthState(): Promise<DashboardAuthState> {
  const clientResult = await createDashboardSupabaseClient();

  if (clientResult.error || !clientResult.data) {
    return {
      status: "missing-config",
      message: clientResult.error ?? "Dashboard Supabase configuration is missing.",
    };
  }

  const supabase = clientResult.data;
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;

  if (userResult.error || !user) {
    return {
      status: "signed-out",
    };
  }

  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    return {
      status: "error",
      message: "Unable to verify dermatologist profile.",
    };
  }

  const profile = profileResult.data as ProfileRole | null;
  const dashboardUser = toDashboardUser(user);

  if (profile?.role !== "dermatologist") {
    return {
      status: "pending-profile",
      user: dashboardUser,
    };
  }

  return {
    status: "authorized",
    user: dashboardUser,
  };
}

export async function requireDermatologist() {
  const authState = await getDashboardAuthState();

  if (authState.status === "authorized") {
    return authState;
  }

  const params = new URLSearchParams();

  if (authState.status === "missing-config") {
    params.set("error", "missing-config");
  } else if (authState.status === "pending-profile") {
    params.set("error", "pending-profile");
  } else if (authState.status === "error") {
    params.set("error", "profile-check-failed");
  }

  redirect(`/login${params.size > 0 ? `?${params.toString()}` : ""}`);
}
