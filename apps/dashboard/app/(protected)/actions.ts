"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createDashboardSupabaseClient } from "@/lib/supabase-server";

export async function signOutAction() {
  const clientResult = await createDashboardSupabaseClient();

  if (clientResult.data) {
    await clientResult.data.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login?message=signed-out");
}
