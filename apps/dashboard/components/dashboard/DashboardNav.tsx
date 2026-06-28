"use client";

import { ClipboardList, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/patients",
    label: "Patients",
    icon: ClipboardList,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link className={`nav-link${active ? " active" : ""}`} href={item.href} key={item.href}>
            <Icon aria-hidden="true" size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
