import Link from "next/link";
import { requireActiveAdmin } from "../../../lib/require-admin";
import { prisma } from "../../../lib/prisma";
import {
  Search,
  Ticket,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";

export const instant = false;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
};

const statusOptions = [
  { value: "BARU", label: "Baru" },
  { value: "DITINJAU", label: "Ditinjau" },
  { value: "DIPROSES", label: "Diproses" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DITUTUP", label: "Ditutup" },
] as const;

const statusStyles: Record<string, string> = {
  BARU: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  DITINJAU: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  DIPROSES: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  SELESAI: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  DITUTUP: "border-white/10 bg-white/5 text-white/50",
};

const statusLabels: Record<string, string> = {
  BARU: "Baru",
  DITINJAU: "Ditinjau",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITUTUP: "Ditutup",
};

function buildPageUrl(
  page: number,
  filters: {
    q: string;
    status: string;
    category: string;
  },
) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  params.set("page", String(page));

  return `/admin/tickets?${params.toString()}`;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  await requireActiveAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const requestedStatus = params.status ?? "";
  const requestedCategory = params.category ?? "";

  const validStatuses = statusOptions.map((item) => item.value);
  const status = validStatuses.includes(
    requestedStatus as (typeof validStatuses)[number],
  )
    ? requestedStatus
    : "";

  const pageSize = 10;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [categories, totalTickets, statusCounts] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.ticket.count(),
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const categoryExists =
    requestedCategory === "" ||
    categories.some((category) => category.id === requestedCategory);

  const category = categoryExists ? requestedCategory : "";

  const where = {
    ...(q
      ? {
          OR: [
            { ticketNumber: { contains: q, mode: "insensitive" as const } },
            { reporterName: { contains: q, mode: "insensitive" as const } },
            { subject: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status
      ? {
          status: status as
            | "BARU"
            | "DITINJAU"
            | "DIPROSES"
            | "SELESAI"
            | "DITUTUP",
        }
      : {}),
    ...(category ? { categoryId: category } : {}),
  };

  const filteredCount = await prisma.ticket.count({ where });
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const skip = (safePage - 1) * pageSize;

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    select: {
      id: true,
      ticketNumber: true,
      reporterName: true,
      reporterEmail: true,
      subject: true,
      status: true,
      createdAt: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const countsByStatus = Object.fromEntries(
    statusCounts.map((item) => [item.status, item._count._all]),
  );

  const activeFilters = Boolean(q || status || category);

  return (
    <main className="min-h-full space-y-7 px-6 py-8 text-white">
      {/* Header */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-[#F70000]/10 text-[#F70000]">
            <Ticket size={22} />
          </div>

          <h1 className="text-2xl font-semibold">Tiket Pengaduan</h1>

          <p className="mt-2 text-sm text-white/50">
            Lihat, cari, dan pantau seluruh laporan pengaduan yang masuk.
          </p>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
          <p className="text-sm text-white/50">Total Tiket</p>
          <p className="mt-3 text-3xl font-semibold">{totalTickets}</p>
          <p className="mt-1 text-xs text-white/35">Seluruh laporan</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
          <p className="text-sm text-white/50">Tiket Baru</p>
          <p className="mt-3 text-3xl font-semibold text-sky-300">
            {countsByStatus.BARU ?? 0}
          </p>
          <p className="mt-1 text-xs text-white/35">Menunggu peninjauan</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
          <p className="text-sm text-white/50">Sedang Diproses</p>
          <p className="mt-3 text-3xl font-semibold text-violet-300">
            {countsByStatus.DIPROSES ?? 0}
          </p>
          <p className="mt-1 text-xs text-white/35">Dalam penanganan</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
          <p className="text-sm text-white/50">Selesai</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-300">
            {countsByStatus.SELESAI ?? 0}
          </p>
          <p className="mt-1 text-xs text-white/35">
            Laporan telah diselesaikan
          </p>
        </div>
      </section>

      {/* Search and filters */}
      <section className="rounded-xl border border-white/10 bg-[#111111] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search size={18} className="text-white/50" />
          <h2 className="font-medium">Cari dan Filter Tiket</h2>
        </div>

        <form
          action="/admin/tickets"
          method="GET"
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_220px_auto_auto]"
        >
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              name="q"
              type="search"
              maxLength={100}
              defaultValue={q}
              placeholder="Nomor tiket, nama, atau subjek..."
              className="h-11 w-full rounded-lg border border-white/10 bg-black/30 pl-10 pr-3 text-sm outline-none transition placeholder:text-white/30 focus:border-[#F70000]/40 focus:ring-2 focus:ring-[#F70000]/20"
            />
          </div>

          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-lg border border-white/10 bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#F70000]/40"
          >
            <option value="">Semua Status</option>
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            name="category"
            defaultValue={category}
            className="h-11 rounded-lg border border-white/10 bg-[#151515] px-3 text-sm text-white outline-none focus:border-[#F70000]/40"
          >
            <option value="">Semua Kategori</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#F70000] px-4 text-sm font-medium transition hover:bg-red-700"
          >
            <Search size={16} />
            Cari
          </button>

          <Link
            href="/admin/tickets"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
          >
            <FilterX size={16} />
            Reset
          </Link>
        </form>

        {activeFilters && (
          <p className="mt-4 text-xs text-white/40">
            Ditemukan {filteredCount} tiket sesuai filter.
          </p>
        )}
      </section>

      {/* Ticket table */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-medium">Daftar Laporan</h2>
            <p className="mt-1 text-xs text-white/40">
              Menampilkan {tickets.length > 0 ? skip + 1 : 0}–
              {skip + tickets.length} dari {filteredCount} tiket
            </p>
          </div>

          <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50">
            Terbaru lebih dahulu
          </span>
        </div>

        {tickets.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/5 text-white/30">
              <Ticket size={26} />
            </div>

            <h3 className="mt-5 font-medium">
              {activeFilters
                ? "Tiket tidak ditemukan"
                : "Belum ada tiket pengaduan"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-white/45">
              {activeFilters
                ? "Coba ubah kata kunci atau filter untuk menemukan tiket yang dicari."
                : "Tiket yang dibuat melalui formulir pengaduan publik akan ditampilkan di halaman ini."}
            </p>

            {activeFilters && (
              <Link
                href="/admin/tickets"
                className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
              >
                Hapus semua filter
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs text-white/40">
                    <th className="px-5 py-4 font-medium">Nomor Tiket</th>
                    <th className="px-5 py-4 font-medium">Pelapor</th>
                    <th className="px-5 py-4 font-medium">Subjek</th>
                    <th className="px-5 py-4 font-medium">Kategori</th>
                    <th className="px-5 py-4 font-medium">Tanggal Masuk</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.07]">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <Link
                          href={`/admin/tickets/${ticket.id}`}
                          className="font-mono text-xs font-medium text-[#F70000] transition hover:text-red-300 hover:underline"
                          title="Lihat detail tiket"
                        >
                          {ticket.ticketNumber}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[180px] truncate text-sm font-medium">
                          {ticket.reporterName}
                        </p>
                        <p className="mt-1 max-w-[180px] truncate text-xs text-white/40">
                          {ticket.reporterEmail}
                        </p>
                      </td>

                      <td className="max-w-[240px] px-5 py-4">
                        <p className="truncate text-sm" title={ticket.subject}>
                          {ticket.subject}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-white/65">
                          {ticket.category?.name ?? "Tanpa kategori"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-white/55">
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(ticket.createdAt)}
                        <p className="mt-1 text-xs text-white/35">
                          {new Intl.DateTimeFormat("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(ticket.createdAt)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            statusStyles[ticket.status] ??
                            "border-white/10 bg-white/5 text-white/50"
                          }`}
                        >
                          {statusLabels[ticket.status] ?? ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-4">
              <p className="text-xs text-white/40">
                Halaman {safePage} dari {totalPages}
              </p>

              <div className="flex items-center gap-2">
                {safePage > 1 ? (
                  <Link
                    href={buildPageUrl(safePage - 1, {
                      q,
                      status,
                      category,
                    })}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm text-white/70 transition hover:bg-white/5"
                  >
                    <ChevronLeft size={16} />
                    Sebelumnya
                  </Link>
                ) : (
                  <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border border-white/5 px-3 text-sm text-white/25">
                    <ChevronLeft size={16} />
                    Sebelumnya
                  </span>
                )}

                {safePage < totalPages ? (
                  <Link
                    href={buildPageUrl(safePage + 1, {
                      q,
                      status,
                      category,
                    })}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm text-white/70 transition hover:bg-white/5"
                  >
                    Berikutnya
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border border-white/5 px-3 text-sm text-white/25">
                    Berikutnya
                    <ChevronRight size={16} />
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
