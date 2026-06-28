"use server";

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

  if (!trimmedEmail || password.length < 8) {
    return null;
  }

  return {
    email: trimmedEmail,
    password,
  };
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const credentials = getCredentials(formData);

  if (!credentials) {
    return {
      status: "error",
      message: "Enter an email and a password with at least 8 characters.",
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
  const signUpResult = await supabase.auth.signUp(credentials);

  if (signUpResult.error) {
    return {
      status: "error",
      message: "Unable to create that account.",
    };
  }

  await supabase.auth.signOut();
  redirect("/login?message=signup-submitted");
}
