import { requireActiveAdmin } from "../../lib/require-admin";
import { prisma } from "../../lib/prisma";

export const instant = false;

const statusLabels: Record<string, string> = {
  BARU: "Baru",
  DITINJAU: "Ditinjau",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITUTUP: "Ditutup",
};

const statusStyles: Record<string, string> = {
  BARU: "bg-red-500/10 text-red-400",
  DITINJAU: "bg-amber-500/10 text-amber-400",
  DIPROSES: "bg-blue-500/10 text-blue-400",
  SELESAI: "bg-emerald-500/10 text-emerald-400",
  DITUTUP: "bg-white/10 text-white/60",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminPage() {
  await requireActiveAdmin();

  const [
    totalTickets,
    newTickets,
    reviewedTickets,
    processingTickets,
    completedTickets,
    closedTickets,
    activeCategories,
    recentTickets,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "BARU" } }),
    prisma.ticket.count({ where: { status: "DITINJAU" } }),
    prisma.ticket.count({ where: { status: "DIPROSES" } }),
    prisma.ticket.count({ where: { status: "SELESAI" } }),
    prisma.ticket.count({ where: { status: "DITUTUP" } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        reporterName: true,
        status: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const stats = [
    {
      label: "Total Tiket",
      value: totalTickets,
      description: "Semua tiket masuk",
      color: "text-white",
    },
    {
      label: "Tiket Baru",
      value: newTickets,
      description: "Menunggu peninjauan",
      color: "text-red-400",
    },
    {
      label: "Sedang Ditangani",
      value: reviewedTickets + processingTickets,
      description: "Ditinjau dan diproses",
      color: "text-blue-400",
    },
    {
      label: "Selesai",
      value: completedTickets + closedTickets,
      description: "Selesai dan ditutup",
      color: "text-emerald-400",
    },
  ];

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section>
          <h2 className="text-2xl font-semibold">Ringkasan Pengaduan</h2>
          <p className="mt-2 text-sm text-white/50">
            Pantau tiket pengaduan dan progres penanganannya.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-[#111111] p-5"
            >
              <p className="text-sm text-white/50">{stat.label}</p>
              <p className={`mt-4 text-3xl font-semibold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-white/40">{stat.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-sm text-white/50">Kategori Aktif</p>
            <p className="mt-3 text-2xl font-semibold">{activeCategories}</p>
            <p className="mt-2 text-xs text-white/40">
              Kategori yang tersedia untuk pengaduan
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-5">
            <p className="text-sm text-white/50">Tiket Belum Selesai</p>
            <p className="mt-3 text-2xl font-semibold text-amber-400">
              {newTickets + reviewedTickets + processingTickets}
            </p>
            <p className="mt-2 text-xs text-white/40">
              Tiket yang masih membutuhkan penanganan
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
          <div className="border-b border-white/10 px-5 py-5">
            <h2 className="font-semibold">Tiket Terbaru</h2>
            <p className="mt-1 text-sm text-white/40">
              Lima tiket terakhir yang tercatat di sistem.
            </p>
          </div>

          {recentTickets.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="font-medium text-white/70">
                Belum ada tiket pengaduan
              </p>
              <p className="mt-2 text-sm text-white/40">
                Tiket yang masuk akan ditampilkan di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs text-white/40">
                  <tr>
                    <th className="px-5 py-4 font-medium">Nomor Tiket</th>
                    <th className="px-5 py-4 font-medium">Subjek</th>
                    <th className="px-5 py-4 font-medium">Pelapor</th>
                    <th className="px-5 py-4 font-medium">Kategori</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-[#F70000]">
                        {ticket.ticketNumber}
                      </td>
                      <td className="min-w-48 px-5 py-4 text-white/80">
                        {ticket.subject}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-white/60">
                        {ticket.reporterName}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-white/60">
                        {ticket.category?.name ?? "Belum dikategorikan"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[ticket.status] ??
                            "bg-white/10 text-white/60"
                          }`}
                        >
                          {statusLabels[ticket.status] ?? ticket.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-white/50">
                        {formatDate(ticket.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
