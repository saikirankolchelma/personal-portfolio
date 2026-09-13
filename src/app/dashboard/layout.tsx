import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSessionUser } from "@/lib/session";
import { signOut } from "@/auth";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s — Dashboard" },
  // Private area: never index, never follow.
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Re-checked here rather than trusting the proxy alone.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <DashboardSidebar email={user.email ?? null} signOutAction={handleSignOut} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
