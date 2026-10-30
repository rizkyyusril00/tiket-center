import { AuthError } from "next-auth";
import { signIn } from "../../../auth";
import { redirect } from "next/navigation";
import PasswordInput from "./password-input";
import { MessageSquareWarning } from "lucide-react";

export const instant = false;

async function loginAction(formData: FormData) {
  "use server";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=CredentialsSignin");
    }

    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090909] px-4 py-10 text-white">
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F70000]/10 blur-[120px]" />

      <section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#101010]/95 p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#F70000]/15 text-[#F70000]">
            <MessageSquareWarning size={28} />
          </div>

          <h1 className="text-xl font-bold tracking-[0.12em]">
            COMPLAINT CENTER
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Portal administrasi pengaduan internal
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold">Masuk sebagai Super Admin</h2>
          <p className="mt-1 text-sm text-white/45">
            Masukkan kredensial administrator untuk melanjutkan.
          </p>
        </div>

        {params.error === "CredentialsSignin" && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            Email atau password salah, atau akun tidak aktif.
          </div>
        )}

        <form action={loginAction} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-white/75">
              Email administrator
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="admin@organisasi.go.id"
              className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none transition placeholder:text-white/30 focus:border-[#F70000]/30 focus:ring-2 focus:ring-[#F70000]/30"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-white/75"
            >
              Password
            </label>
            <PasswordInput />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#F70000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F70000]"
          >
            Masuk ke Dashboard
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-white/30">
          Akses terbatas untuk administrator yang berwenang.
        </p>
      </section>
    </main>
  );
}
