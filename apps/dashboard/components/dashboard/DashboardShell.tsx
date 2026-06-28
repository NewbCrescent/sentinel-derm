import { LogOut, ShieldCheck } from "lucide-react";

import { signOutAction } from "@/app/(protected)/actions";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import type { DashboardUser } from "@/types/auth";

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: DashboardUser;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck aria-hidden="true" size={20} />
          </span>
          <span>Sentinel Derm</span>
        </div>
        <DashboardNav />
        <div className="sidebar-footer">
          <div className="user-block">
            <p>Signed in</p>
            <strong>{user.email}</strong>
          </div>
          <form action={signOutAction} className="auth-form">
            <button className="button secondary" type="submit">
              <LogOut aria-hidden="true" size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
