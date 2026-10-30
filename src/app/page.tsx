"use client";

import { FormEvent, useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  LockKeyhole,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Clock3,
  LoaderCircle,
  CircleAlert,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ActiveTab = "complaint" | "tracking";

type TicketEvent = {
  eventType: string;
  message: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
};

type TrackedTicket = {
  ticketNumber: string;
  subject: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  events: TicketEvent[];
};

type ComplaintCategory = {
  id: string;
  name: string;
  description: string | null;
};

const statusStyles: Record<string, string> = {
  BARU: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  DITINJAU: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  DIPROSES: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  SELESAI: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  DITUTUP: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("complaint");
  const [ticketNumber, setTicketNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackedTicket, setTrackedTicket] = useState<TrackedTicket | null>(
    null,
  );
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [createdTicketNumber, setCreatedTicketNumber] = useState("");
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch("/api/categories", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Gagal memuat kategori.");
        }

        const data = await response.json();

        if (!cancelled) {
          setCategories(data.categories);
          setCategoryError("");
        }
      } catch {
        if (!cancelled) {
          setCategoryError(
            "Kategori gagal dimuat. Silakan muat ulang halaman.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleTrackTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsTracking(true);
    setTrackingError("");
    setTrackedTicket(null);

    try {
      const response = await fetch("/api/tickets/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          ticketNumber,
          email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setTrackingError(
          result.message || "Data pelacakan tidak ditemukan atau tidak sesuai.",
        );
        return;
      }

      setTrackedTicket(result.ticket as TrackedTicket);
    } catch {
      setTrackingError(
        "Tidak dapat menghubungi server. Periksa koneksi lalu coba kembali.",
      );
    } finally {
      setIsTracking(false);
    }
  }

  async function handleSubmitComplaint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmissionError("");
    setCreatedTicketNumber("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          reporterName: formData.get("reporter"),
          email: formData.get("email"),
          categoryId: selectedCategoryId,
          subject: formData.get("subject"),
          description: formData.get("description"),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmissionError(result.message || "Pengaduan gagal dikirim.");
        return;
      }

      setCreatedTicketNumber(result.ticket.ticketNumber);
      form.reset();
      setSelectedCategoryId("");
    } catch {
      setSubmissionError(
        "Tidak dapat menghubungi server. Periksa koneksi lalu coba kembali.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100">
      <header className="border-b border-white/[0.08] bg-[#09090b]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#F70000]/10 text-[#F70000] ring-1 ring-[#F70000]/30">
              <MessageSquareWarning size={21} />
            </div>
            <div>
              <p className="font-semibold tracking-tight text-white">
                Complaint Center
              </p>
              <p className="text-xs text-zinc-500">Sistem Pengaduan Internal</p>
            </div>
          </a>

          <div className="hidden items-center gap-2 text-sm text-zinc-400 sm:flex">
            <LockKeyhole size={15} />
            <span>Privasi dan kerahasiaan diutamakan</span>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-[#F70000]/[0.08] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F70000]/20 bg-[#F70000]/[0.07] px-3.5 py-2 text-xs font-medium text-red-300">
              <ShieldCheck size={15} />
              Kanal pengaduan resmi internal
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              Suara Anda,
              <span className="block text-[#F70000]">Perubahan Bersama.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              Sampaikan pengaduan atau laporkan permasalahan melalui kanal yang
              terstruktur. Pantau perkembangan penanganan menggunakan nomor
              tiket dan email pelapor.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-6 text-xs text-zinc-400 sm:text-sm">
              <div className="flex items-center gap-2">
                <LockKeyhole size={16} className="text-[#F70000]" />
                Informasi terlindungi
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#F70000]" />
                Proses tercatat
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#F70000]" />
                Status dapat dipantau
              </div>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:gap-8">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveTab("complaint")}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  activeTab === "complaint"
                    ? "border-[#F70000]/50 bg-[#F70000]/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F70000]/10 text-[#F70000]">
                    <FileText size={21} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-medium text-white">Buat Pengaduan</h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Sampaikan masalah, laporan, atau keluhan baru.
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className={
                      activeTab === "complaint"
                        ? "text-[#F70000]"
                        : "text-zinc-600"
                    }
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("tracking");
                  setTrackingError("");
                  setTrackedTicket(null);
                }}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  activeTab === "tracking"
                    ? "border-[#F70000]/50 bg-[#F70000]/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300">
                    <Search size={21} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-medium text-white">Lacak Pengaduan</h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Periksa perkembangan tiket yang telah Anda kirim.
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className={
                      activeTab === "tracking"
                        ? "text-[#F70000]"
                        : "text-zinc-600"
                    }
                  />
                </div>
              </button>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <LockKeyhole size={16} className="text-[#F70000]" />
                  Perlindungan informasi
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Gunakan nomor tiket dan email yang terdaftar. Riwayat internal
                  petugas tidak ditampilkan pada halaman pelapor.
                </p>
              </div>
            </div>

            <Card className="border-white/[0.09] bg-[#111113] text-zinc-100 shadow-2xl shadow-black/20">
              {activeTab === "complaint" ? (
                <>
                  <CardHeader className="border-b border-white/[0.07] p-6 sm:p-8">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#F70000]">
                      Formulir pengaduan
                    </p>
                    <CardTitle className="mt-2 text-2xl text-white">
                      Sampaikan pengaduan
                    </CardTitle>
                    <CardDescription className="leading-6 text-zinc-400">
                      Isi informasi berikut dengan jelas agar pengaduan dapat
                      ditinjau oleh petugas.
                    </CardDescription>
                  </CardHeader>

                  <CardContent key="complaint-form" className="p-6 sm:p-8">
                    <form
                      className="space-y-5"
                      onSubmit={handleSubmitComplaint}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="reporter" className="text-zinc-200">
                          Nama pelapor
                        </Label>
                        <Input
                          id="reporter"
                          name="reporter"
                          placeholder="Masukkan nama lengkap"
                          required
                          className="h-11 border-white/10 bg-white/[0.03] placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#F70000]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="reporter-email"
                          className="text-zinc-200"
                        >
                          Email pelapor
                        </Label>
                        <Input
                          id="reporter-email"
                          name="email"
                          type="email"
                          placeholder="nama@instansi.go.id"
                          required
                          className="h-11 border-white/10 bg-white/[0.03] placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#F70000]/30"
                        />
                        <p className="text-xs leading-5 text-zinc-500">
                          Gunakan email ini saat melacak pengaduan. Tidak ada
                          email verifikasi otomatis.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-zinc-200">
                          Kategori pengaduan
                        </Label>

                        <select
                          id="category"
                          name="categoryId"
                          value={selectedCategoryId}
                          onChange={(event) =>
                            setSelectedCategoryId(event.target.value)
                          }
                          required
                          disabled={
                            isLoadingCategories ||
                            categories.length === 0 ||
                            Boolean(categoryError)
                          }
                          className="h-11 w-full rounded-md border border-white/10 bg-[#18181b] px-3 text-sm text-zinc-100 outline-none transition focus-visible:ring-2 focus-visible:ring-[#F70000]/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="" disabled>
                            {isLoadingCategories
                              ? "Memuat kategori..."
                              : categories.length === 0
                                ? "Belum ada kategori aktif"
                                : "Pilih kategori pengaduan"}
                          </option>

                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>

                        {selectedCategoryId && (
                          <p className="text-xs leading-5 text-zinc-500">
                            {categories.find(
                              (category) => category.id === selectedCategoryId,
                            )?.description ||
                              "Kategori pengaduan yang dipilih."}
                          </p>
                        )}

                        {categoryError && (
                          <p
                            role="alert"
                            className="text-xs leading-5 text-red-400"
                          >
                            {categoryError}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-zinc-200">
                          Judul pengaduan
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="Ringkas permasalahan Anda"
                          required
                          className="h-11 border-white/10 bg-white/[0.03] placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#F70000]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-zinc-200">
                          Detail pengaduan
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Jelaskan kronologi, waktu kejadian, dan informasi yang relevan..."
                          required
                          className="min-h-32 resize-y border-white/10 bg-white/[0.03] placeholder:text-zinc-600 focus-visible:ring-[#F70000]"
                        />
                      </div>

                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-xs leading-5 text-zinc-500">
                        Pastikan informasi yang disampaikan akurat. Jangan
                        mencantumkan kata sandi atau informasi rahasia yang
                        tidak diperlukan.
                      </div>

                      {submissionError && (
                        <div
                          role="alert"
                          className="rounded-xl border border-red-500/20 bg-red-500/[0.07] p-3 text-sm leading-6 text-red-300"
                        >
                          {submissionError}
                        </div>
                      )}

                      {createdTicketNumber && (
                        <div
                          role="status"
                          className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                            <CheckCircle2 size={18} />
                            Pengaduan berhasil disimpan
                          </div>

                          <p className="text-sm text-zinc-400">
                            Simpan nomor tiket berikut untuk memeriksa
                            perkembangan pengaduan.
                          </p>

                          <div className="flex items-center gap-2">
                            <code className="min-w-0 flex-1 break-all rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white">
                              {createdTicketNumber}
                            </code>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label="Salin nomor tiket"
                              title="Salin nomor tiket"
                              className="size-10 shrink-0 border-white/10 bg-white/[0.04] text-zinc-300 hover:border-[#F70000]/40 hover:bg-[#F70000]/10 hover:text-white"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    createdTicketNumber,
                                  );
                                  toast.success(
                                    "Nomor tiket berhasil disalin.",
                                  );
                                } catch {
                                  toast.error("Gagal menyalin nomor tiket.");
                                }
                              }}
                            >
                              <Copy size={18} />
                            </Button>
                          </div>

                          <Button
                            type="button"
                            className="w-full bg-[#F70000] text-white hover:bg-red-700"
                            onClick={() => {
                              setTicketNumber(createdTicketNumber);
                              setEmail("");
                              setTrackingError("");
                              setTrackedTicket(null);
                              setActiveTab("tracking");
                            }}
                          >
                            Lacak Pengaduan
                            <Search size={17} className="ml-2" />
                          </Button>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          isLoadingCategories ||
                          categories.length === 0 ||
                          !selectedCategoryId ||
                          Boolean(categoryError)
                        }
                        className="h-11 w-full bg-[#F70000] font-medium text-white hover:bg-red-700"
                      >
                        {isSubmitting ? (
                          <>
                            <LoaderCircle
                              size={17}
                              className="mr-2 animate-spin"
                            />
                            Mengirim Pengaduan...
                          </>
                        ) : (
                          <>
                            Lanjutkan Pengaduan
                            <ArrowRight size={17} className="ml-2" />
                          </>
                        )}
                      </Button>

                      <p className="text-center text-xs leading-5 text-zinc-500">
                        Pengiriman pengaduan sedang dalam tahap pengembangan.
                      </p>
                    </form>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader className="border-b border-white/[0.07] p-6 sm:p-8">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#F70000]">
                      Pelacakan tiket
                    </p>
                    <CardTitle className="mt-2 text-2xl text-white">
                      Periksa status pengaduan
                    </CardTitle>
                    <CardDescription className="leading-6 text-zinc-400">
                      Masukkan nomor tiket dan email yang digunakan saat membuat
                      pengaduan.
                    </CardDescription>
                  </CardHeader>

                  <CardContent
                    key="tracking-form"
                    className="space-y-6 p-6 sm:p-8"
                  >
                    <form className="space-y-5" onSubmit={handleTrackTicket}>
                      <div className="space-y-2">
                        <Label
                          htmlFor="ticket-number"
                          className="text-zinc-200"
                        >
                          Nomor tiket
                        </Label>
                        <Input
                          id="ticket-number"
                          name="ticketNumber"
                          value={ticketNumber}
                          onChange={(event) =>
                            setTicketNumber(event.target.value)
                          }
                          placeholder="Contoh: CC-TEST-1792724623818-DAB3F5"
                          autoComplete="off"
                          required
                          className="h-11 border-white/10 bg-white/[0.03] placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#F70000]/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="tracking-email"
                          className="text-zinc-200"
                        >
                          Email pelapor
                        </Label>
                        <Input
                          id="tracking-email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="Email yang digunakan saat mengadu"
                          autoComplete="email"
                          required
                          className="h-11 border-white/10 bg-white/[0.03] placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#F70000]/30"
                        />
                      </div>

                      {trackingError && (
                        <div
                          role="alert"
                          className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] p-3 text-sm leading-6 text-red-300"
                        >
                          <CircleAlert size={18} className="mt-1 shrink-0" />
                          <p>{trackingError}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isTracking}
                        className="h-11 w-full bg-[#F70000] font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {isTracking ? (
                          <>
                            <LoaderCircle
                              size={17}
                              className="mr-2 animate-spin"
                            />
                            Memeriksa tiket...
                          </>
                        ) : (
                          <>
                            Periksa Status
                            <Search size={17} className="ml-2" />
                          </>
                        )}
                      </Button>

                      <p className="text-xs leading-5 text-zinc-500">
                        Data hanya akan ditampilkan jika nomor tiket dan email
                        sesuai dengan data pengaduan.
                      </p>
                    </form>

                    {trackedTicket && (
                      <div
                        aria-live="polite"
                        className="space-y-5 border-t border-white/[0.08] pt-6"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 size={21} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-emerald-300">
                              Tiket berhasil ditemukan
                            </p>
                            <p className="mt-1 break-all font-mono text-xs text-zinc-400">
                              {trackedTicket.ticketNumber}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                          <p className="text-xs text-zinc-500">
                            Judul pengaduan
                          </p>
                          <h3 className="mt-2 break-words font-medium text-white">
                            {trackedTicket.subject}
                          </h3>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm text-zinc-400">
                              Status saat ini
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                                statusStyles[trackedTicket.status] ??
                                statusStyles.BARU
                              }`}
                            >
                              {trackedTicket.statusLabel}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 border-t border-white/[0.07] pt-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-zinc-500">
                                Tanggal pengaduan
                              </p>
                              <p className="mt-1 text-sm leading-6 text-zinc-300">
                                {formatDate(trackedTicket.createdAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-500">
                                Terakhir diperbarui
                              </p>
                              <p className="mt-1 text-sm leading-6 text-zinc-300">
                                {formatDate(trackedTicket.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="mb-4 flex items-center gap-2">
                            <Clock3 size={18} className="text-[#F70000]" />
                            <h3 className="font-medium text-white">
                              Riwayat perkembangan
                            </h3>
                          </div>

                          {trackedTicket.events.length === 0 ? (
                            <p className="rounded-xl border border-white/[0.07] p-4 text-sm leading-6 text-zinc-500">
                              Belum ada riwayat perkembangan yang dapat
                              ditampilkan.
                            </p>
                          ) : (
                            <div className="space-y-0">
                              {trackedTicket.events.map((item, index) => (
                                <div
                                  key={`${item.createdAt}-${index}`}
                                  className="relative flex gap-3 pb-5 last:pb-0"
                                >
                                  <div className="flex flex-col items-center">
                                    <div className="mt-1 size-2.5 shrink-0 rounded-full bg-[#F70000]" />
                                    {index <
                                      trackedTicket.events.length - 1 && (
                                      <div className="mt-2 w-px flex-1 bg-white/[0.10]" />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1 pb-1">
                                    <p className="text-sm leading-6 text-zinc-200">
                                      {item.message ||
                                        "Pembaruan pada tiket telah dicatat."}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                                      {formatDate(item.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setTrackedTicket(null)}
                          className="w-full border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                        >
                          Tutup Hasil Pelacakan
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Complaint Center</p>
          <p>Sistem Pengaduan Internal · Akses sesuai kewenangan</p>
        </div>
      </footer>
    </main>
  );
}
