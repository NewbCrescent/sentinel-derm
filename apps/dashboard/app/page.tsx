import { redirect } from "next/navigation";

import { getDashboardAuthState } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const authState = await getDashboardAuthState();

  if (authState.status === "authorized") {
    redirect("/patients");
  }

  if (authState.status === "pending-profile") {
    redirect("/login?error=pending-profile");
  }

  if (authState.status === "missing-config") {
    redirect("/login?error=missing-config");
  }

  redirect("/login");
}
