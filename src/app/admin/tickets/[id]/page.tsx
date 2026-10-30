import Link from "next/link";
import AdminToast from "../../../../components/admin-toast";
import ActivityTimeline from "./activity-timeline";
import { notFound } from "next/navigation";
import { requireActiveAdmin } from "../../../../lib/require-admin";
import { prisma } from "../../../../lib/prisma";
import type { TicketStatus } from "../../../../generated/prisma/client";
import { addInternalNote, updateTicketStatus } from "./actions";
import {
  ArrowLeft,
  Clock3,
  FileText,
  History,
  MessageSquare,
  UserRound,
} from "lucide-react";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

const statusLabels: Record<TicketStatus, string> = {
  BARU: "Baru",
  DITINJAU: "Ditinjau",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITUTUP: "Ditutup",
};

const statusStyles: Record<TicketStatus, string> = {
  BARU: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  DITINJAU: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  DIPROSES: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  SELESAI: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  DITUTUP: "border-white/10 bg-white/5 text-white/50",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function eventTitle(eventType: string) {
  switch (eventType) {
    case "STATUS_CHANGED":
      return "Perubahan status";
    case "INTERNAL_NOTE":
      return "Catatan internal";
    case "TICKET_CREATED":
      return "Tiket dibuat";
    default:
      return "Aktivitas tiket";
  }
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requireActiveAdmin();

  const { id } = await params;
  const query = await searchParams;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      category: true,
      events: {
        include: {
          actorAdmin: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const statusAction = updateTicketStatus.bind(null, ticket.id);
  const noteAction = addInternalNote.bind(null, ticket.id);

  return (
    <div className="min-h-full bg-[#090909] px-5 py-8 text-white md:px-8">
      <AdminToast success={query.success} error={query.error} />
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/tickets"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Kembali ke daftar tiket
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#F70000]">
              DETAIL PENGADUAN
            </p>
            <h1 className="mt-3 break-all text-2xl font-bold md:text-3xl">
              {ticket.ticketNumber}
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Dibuat pada {formatDate(ticket.createdAt)}
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-sm font-medium ${statusStyles[ticket.status]}`}
          >
            {statusLabels[ticket.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          {/* Informasi pengaduan */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-[#101010] p-5 md:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white/70">
                  <FileText size={19} />
                </div>
                <div>
                  <h2 className="font-semibold">Informasi Pengaduan</h2>
                  <p className="mt-1 text-xs text-white/40">
                    Informasi yang dikirim oleh pelapor
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs text-white/40">Subjek pengaduan</p>
                  <p className="mt-2 text-base font-semibold">
                    {ticket.subject}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/40">Kategori</p>
                  <p className="mt-2 text-sm">
                    {ticket.category?.name ?? "Belum dikategorikan"}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-xs text-white/40">Deskripsi pengaduan</p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-white/75">
                    {ticket.description}
                  </p>
                </div>
              </div>
            </section>

            {/* Riwayat aktivitas */}
            <ActivityTimeline events={ticket.events} />
          </div>

          {/* Panel admin */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-[#101010] p-5 md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#F70000]/10 text-[#F70000]">
                  <UserRound size={19} />
                </div>
                <div>
                  <h2 className="font-semibold">Informasi Pelapor</h2>
                  <p className="mt-1 text-xs text-white/40">
                    Identitas pengirim laporan
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/40">Nama</p>
                  <p className="mt-1 break-words text-sm">
                    {ticket.reporterName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Email</p>
                  <p className="mt-1 break-all text-sm">
                    {ticket.reporterEmail}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#101010] p-5 md:p-6">
              <h2 className="font-semibold">Perbarui Status</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Perubahan status akan tercatat di riwayat aktivitas.
              </p>

              <form action={statusAction} className="mt-5 space-y-4">
                <label
                  htmlFor="status"
                  className="block text-xs font-medium text-white/55"
                >
                  Status tiket
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue={ticket.status}
                  className="w-full rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none transition focus:border-[#F70000]/60"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#F70000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Simpan Status
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#101010] p-5 md:p-6">
              <h2 className="font-semibold">Catatan Internal</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">
                Catatan ini hanya untuk admin dan tidak ditampilkan kepada
                pelapor.
              </p>

              <form action={noteAction} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="visibility"
                    className="block text-xs font-medium text-white/55"
                  >
                    Visibilitas catatan
                  </label>

                  <select
                    id="visibility"
                    name="visibility"
                    defaultValue="INTERNAL"
                    className="w-full rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white outline-none transition focus:border-[#F70000]/60"
                  >
                    <option value="INTERNAL">
                      Internal saja — hanya petugas
                    </option>
                    <option value="REPORTER">
                      Bagikan ke pelapor — tampil di pelacakan
                    </option>
                  </select>

                  <p className="text-xs leading-5 text-white/40">
                    Pilih dengan cermat. Catatan yang dibagikan akan dapat
                    dibaca oleh siapa pun yang berhasil melakukan pelacakan
                    menggunakan nomor tiket dan email pelapor.
                  </p>
                </div>

                <label
                  htmlFor="message"
                  className="block text-xs font-medium text-white/55"
                >
                  Isi catatan
                </label>

                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={5000}
                  rows={5}
                  placeholder="Tuliskan hasil pemeriksaan atau tindak lanjut..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#F70000]/60"
                />

                <button
                  type="submit"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Tambahkan Catatan
                </button>
              </form>
            </section>

            <div className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
              <MessageSquare
                size={17}
                className="mt-0.5 shrink-0 text-amber-300"
              />
              <p className="text-xs leading-5 text-white/50">
                Jaga kerahasiaan informasi pelapor. Jangan memasukkan informasi
                sensitif yang tidak diperlukan ke dalam catatan internal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
