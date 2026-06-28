import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireDermatologist } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authState = await requireDermatologist();

  return <DashboardShell user={authState.user}>{children}</DashboardShell>;
}
