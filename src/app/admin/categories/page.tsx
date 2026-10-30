import { auth } from "../../../../auth";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import { updateCategory, toggleCategory } from "./actions";
import CreateCategoryModal from "./create-category-modal";
import DeleteCategoryButton from "./delete-category-button";
import AdminToast from "../../../components/admin-toast";

export const instant = false;

type PageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

const errors: Record<string, string> = {
  "invalid-name": "Nama kategori wajib diisi dan maksimal 100 karakter.",
  "invalid-order": "Urutan harus berupa bilangan bulat minimal 1.",
  "invalid-id": "ID kategori tidak valid.",
  duplicate: "Nama kategori tersebut sudah digunakan.",
  "duplicate-order":
    "Nomor urut sudah digunakan kategori lain. Pilih nomor yang berbeda.",
  "duplicate-data":
    "Data bertabrakan dengan data lain. Periksa nama dan nomor urut kategori.",
  "not-found": "Kategori tidak ditemukan.",
  "in-use":
    "Kategori tidak dapat dihapus karena sudah digunakan oleh tiket pengaduan.",
  "delete-failed": "Kategori gagal dihapus. Silakan coba kembali.",
};

export default async function CategoriesPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const activeCount = categories.filter((category) => category.isActive).length;

  return (
    <main className="min-h-screen bg-[#090909] px-6 py-8 text-white">
      <AdminToast success={params.success} error={params.error} />

      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section>
          <h1 className="text-2xl font-semibold">Kategori Pengaduan</h1>

          <p className="mt-2 text-sm text-white/50">
            Kelola kategori yang tersedia untuk pelaporan pengaduan.
          </p>
        </section>

        {/* Pesan aksesibel untuk pembaca layar */}
        {params.error && errors[params.error] && (
          <p className="sr-only" role="status">
            {errors[params.error]}
          </p>
        )}

        {/* Ringkasan kategori */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-sm text-white/50">Total Kategori</p>
            <p className="mt-3 text-3xl font-semibold">{categories.length}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-sm text-white/50">Kategori Aktif</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-400">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-sm text-white/50">Kategori Nonaktif</p>
            <p className="mt-3 text-3xl font-semibold text-white/60">
              {categories.length - activeCount}
            </p>
          </div>
        </section>

        {/* Tombol tambah kategori */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#111111] p-5">
          <div>
            <h2 className="font-semibold">Daftar Kategori</h2>

            <p className="mt-1 text-sm text-white/50">
              Tambahkan kategori atau kelola kategori yang sudah ada.
            </p>
          </div>

          <CreateCategoryModal />
        </section>

        {/* Daftar kategori */}
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="font-semibold">Semua Kategori</h2>

            <p className="mt-1 text-sm text-white/50">
              Setiap kategori harus memiliki urutan unik mulai dari 1.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-white/70">Belum ada kategori</p>

              <p className="mt-2 text-sm text-white/40">
                Klik Tambah Kategori untuk membuat kategori pertama.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {categories.map((category) => (
                <div key={category.id} className="p-6">
                  {/* Nama dan toggle status */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{category.name}</h3>

                      <p className="mt-1 text-xs text-white/40">
                        Dibuat pada{" "}
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(category.createdAt)}
                      </p>
                    </div>

                    <form action={toggleCategory}>
                      <input type="hidden" name="id" value={category.id} />

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm ${
                            category.isActive
                              ? "text-emerald-400"
                              : "text-white/40"
                          }`}
                        >
                          {category.isActive ? "Aktif" : "Nonaktif"}
                        </span>

                        <button
                          type="submit"
                          role="switch"
                          aria-checked={category.isActive}
                          aria-label={`${
                            category.isActive ? "Nonaktifkan" : "Aktifkan"
                          } kategori ${category.name}`}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F70000] ${
                            category.isActive ? "bg-emerald-500" : "bg-white/20"
                          }`}
                        >
                          <span
                            className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                              category.isActive
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Form edit kategori */}
                  <form action={updateCategory} className="space-y-4">
                    <input type="hidden" name="id" value={category.id} />

                    <div>
                      <label
                        htmlFor={`name-${category.id}`}
                        className="mb-2 block text-sm text-white/70"
                      >
                        Nama kategori
                      </label>

                      <input
                        id={`name-${category.id}`}
                        name="name"
                        type="text"
                        maxLength={100}
                        required
                        defaultValue={category.name}
                        className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-[#F70000]/30 focus:ring-2 focus:ring-[#F70000]/30"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`description-${category.id}`}
                        className="mb-2 block text-sm text-white/70"
                      >
                        Deskripsi
                      </label>

                      <textarea
                        id={`description-${category.id}`}
                        name="description"
                        rows={2}
                        defaultValue={category.description ?? ""}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-[#F70000]/30 focus:ring-2 focus:ring-[#F70000]/30"
                      />
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-32">
                        <label
                          htmlFor={`order-${category.id}`}
                          className="mb-2 block text-sm text-white/70"
                        >
                          Urutan
                        </label>

                        <input
                          id={`order-${category.id}`}
                          name="sortOrder"
                          type="number"
                          min={1}
                          step={1}
                          required
                          defaultValue={category.sortOrder}
                          className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-[#F70000]/30 focus:ring-2 focus:ring-[#F70000]/30"
                        />
                      </div>

                      <button
                        type="submit"
                        className="rounded-lg bg-[#F70000] px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        Simpan Perubahan
                      </button>
                    </div>

                    {category.sortOrder < 1 && (
                      <p className="text-sm text-amber-400">
                        Urutan saat ini tidak valid. Ubah menjadi angka positif
                        yang belum digunakan.
                      </p>
                    )}
                  </form>

                  {/* Form hapus terpisah, tidak bersarang dalam form edit */}
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <DeleteCategoryButton
                      id={category.id}
                      name={category.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
