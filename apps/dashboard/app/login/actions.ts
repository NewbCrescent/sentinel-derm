"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createDashboardSupabaseClient } from "@/lib/supabase-server";
import type { AuthFormState } from "@/types/auth";

function getCredentials(formData: FormData): { email: string; password: string } | null {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    return null;
  }

  return {
    email: trimmedEmail,
    password,
  };
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = getCredentials(formData);

  if (!credentials) {
    return {
      status: "error",
      message: "Enter an email and password.",
    };
  }

  const clientResult = await createDashboardSupabaseClient();

  if (clientResult.error || !clientResult.data) {
    return {
      status: "error",
      message: clientResult.error ?? "Dashboard Supabase configuration is missing.",
    };
  }

  const supabase = clientResult.data;
  const signInResult = await supabase.auth.signInWithPassword(credentials);

  if (signInResult.error) {
    return {
      status: "error",
      message: "Unable to sign in with those credentials.",
    };
  }

  const user = signInResult.data.user;

  if (!user) {
    return {
      status: "error",
      message: "Unable to verify your session.",
    };
  }

  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Unable to verify dermatologist access.",
    };
  }

  const profile = profileResult.data as { role: string | null } | null;

  if (profile?.role !== "dermatologist") {
    await supabase.auth.signOut();
    redirect("/login?error=pending-profile");
  }

  revalidatePath("/", "layout");
  redirect("/patients");
}
