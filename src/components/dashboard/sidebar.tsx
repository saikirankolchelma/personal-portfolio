"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  BookOpen,
  CheckSquare,
  Download,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  X,
} from "lucide-react";

import { dashboardNav } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

const icons = {
  layout: LayoutDashboard,
  checklist: CheckSquare,
  book: BookOpen,
  notes: NotebookPen,
  folder: FolderKanban,
  bot: Bot,
  inbox: Inbox,
  download: Download,
} as const;

export function DashboardSidebar({
  email,
  signOutAction,
}: {
  email: string | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {dashboardNav.map((item) => {
        const Icon = icons[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              isActive(item.href)
                ? "bg-accent-soft text-accent"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-border pt-4">
      {email ? (
        <p className="mb-3 truncate px-3 text-xs text-fg-subtle" title={email}>
          {email}
        </p>
      ) : null}
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-danger"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* mobile bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="text-sm font-semibold">
          Workspace
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-muted"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-b border-border p-4 lg:hidden">
          {nav}
          <div className="mt-4">{footer}</div>
        </div>
      ) : null}

      {/* desktop rail */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-border bg-bg-subtle p-4 lg:flex">
        <div>
          <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface font-mono text-[0.7rem] text-accent">
              SK
            </span>
            <span className="text-sm font-semibold">Workspace</span>
          </Link>
          {nav}
        </div>
        {footer}
      </aside>
    </>
  );
}
