"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  Ticket,
  Settings,
  MessageSquareWarning,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Kategori Pengaduan",
    href: "/admin/categories",
    icon: Tags,
    enabled: true,
  },
  {
    label: "Tiket Pengaduan",
    href: "/admin/tickets",
    icon: Ticket,
    enabled: true,
  },
  {
    label: "Pengaturan",
    href: "/admin/settings",
    icon: Settings,
    enabled: false,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-full shrink-0 flex-col overflow-hidden border-b border-white/10 bg-[#0D0D0D] md:sticky md:top-0 md:w-[294px] md:border-r md:border-b-0">
      {/* Logo */}
      <Link
        href="/admin"
        className="flex min-h-[102px] shrink-0 items-center gap-3 border-b border-white/10 px-6"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F70000]/15 text-[#F70000]">
          <MessageSquareWarning size={23} />
        </div>

        <div>
          <p className="text-sm font-bold tracking-[0.12em]">COMPLAINT</p>
          <p className="mt-0.5 text-xs font-bold tracking-[0.2em] text-[#F70000]">
            CENTER
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-7">
        <p className="mb-4 px-4 text-[11px] font-bold tracking-[0.2em] text-white/35">
          MENU UTAMA
        </p>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            const className = [
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition",
              active
                ? "bg-[#F70000]/10 font-medium text-[#F70000]"
                : "text-white/65 hover:bg-white/5 hover:text-white",
            ].join(" ");

            if (!item.enabled) {
              return (
                <div
                  key={item.href}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/30"
                >
                  <Icon size={19} />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[10px] text-white/25">Segera</span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 px-6 py-4">
        <p className="text-xs text-white/30">Complaint Center</p>
        <p className="mt-1 text-[11px] text-white/20">
          Internal Complaint Management
        </p>
      </div>
    </aside>
  );
}
