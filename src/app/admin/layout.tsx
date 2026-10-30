import { signOut } from "../../../auth";
import { requireActiveAdmin } from "../../lib/require-admin";
import AdminSidebar from "./admin-sidebar";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireActiveAdmin();

  return (
    <>
      <div className="h-screen overflow-hidden bg-[#090909] text-white md:flex">
        <aside className="h-screen shrink-0">
          <AdminSidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="sticky top-0 z-30 flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0D0D0D] px-6 py-4">
            <div>
              <p className="text-sm font-medium">
                {admin.name ?? "Super Admin"}
              </p>
              <p className="text-xs text-white/40">Administrator</p>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-[#F70000]/50 hover:text-white"
              >
                Keluar
              </button>
            </form>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}
