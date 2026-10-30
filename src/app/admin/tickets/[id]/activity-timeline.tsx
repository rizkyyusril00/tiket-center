"use client";

import { useState } from "react";
import {
  Clock3,
  MessageSquare,
  History,
  ChevronDown,
  LockKeyhole,
  Users,
} from "lucide-react";

type TicketStatus = "BARU" | "DITINJAU" | "DIPROSES" | "SELESAI" | "DITUTUP";

type ActivityEvent = {
  id: string;
  visibility: "INTERNAL" | "REPORTER";
  eventType: string;
  message: string | null;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  createdAt: Date;
  actorAdmin: {
    name: string;
  } | null;
};

type ActivityTimelineProps = {
  events: ActivityEvent[];
};

const statusLabels: Record<TicketStatus, string> = {
  BARU: "Baru",
  DITINJAU: "Ditinjau",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITUTUP: "Ditutup",
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
      return "Catatan Internal";
    case "REPORTER_NOTE":
      return "Catatan untuk Pelapor";
    case "TICKET_CREATED":
      return "Tiket dibuat";
    default:
      return "Aktivitas tiket";
  }
}

function visibilityLabel(event: ActivityEvent) {
  if (event.eventType === "INTERNAL_NOTE") {
    return "Internal saja";
  }

  if (event.eventType === "REPORTER_NOTE") {
    return "Dibagikan ke Pelapor";
  }

  if (
    event.eventType !== "STATUS_CHANGED" &&
    event.eventType !== "TICKET_CREATED"
  ) {
    return event.visibility === "INTERNAL"
      ? "Internal saja"
      : "Dibagikan ke Pelapor";
  }

  return null;
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(3);

  const visibleEvents = events.slice(0, visibleCount);
  const remainingCount = events.length - visibleEvents.length;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#101010] p-5 md:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white/70">
          <History size={19} />
        </div>

        <div>
          <h2 className="font-semibold">Riwayat Aktivitas</h2>
          <p className="mt-1 text-xs text-white/40">
            Catatan aktivitas dan tindak lanjut tiket
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="rounded-xl border border-white/10 p-4 text-sm text-white/45">
          Belum ada aktivitas yang tercatat.
        </p>
      ) : (
        <>
          <div className="space-y-0">
            {visibleEvents.map((event, index) => {
              const label = visibilityLabel(event);
              const isInternal = event.visibility === "INTERNAL";
              const isReporterNote = event.eventType === "REPORTER_NOTE";

              return (
                <div
                  key={event.id}
                  className="relative flex gap-4 pb-7 last:pb-0"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`z-10 flex size-9 shrink-0 items-center justify-center rounded-full ${
                        isInternal
                          ? "bg-amber-500/10 text-amber-300"
                          : isReporterNote
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-[#F70000]/10 text-[#F70000]"
                      }`}
                    >
                      {isInternal ? (
                        <LockKeyhole size={16} />
                      ) : isReporterNote ? (
                        <Users size={16} />
                      ) : event.eventType === "TICKET_CREATED" ? (
                        <Clock3 size={16} />
                      ) : (
                        <MessageSquare size={16} />
                      )}
                    </div>

                    {index < visibleEvents.length - 1 && (
                      <div className="absolute mt-9 h-[calc(100%-2.25rem)] w-px bg-white/10" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {eventTitle(event.eventType)}
                      </p>

                      {label && (
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                            isInternal
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          }`}
                        >
                          {label}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-white/40">
                      {formatDate(new Date(event.createdAt))}
                      {" · "}
                      {event.actorAdmin?.name ?? "Sistem"}
                    </p>

                    {event.fromStatus && event.toStatus && (
                      <p className="mt-3 text-sm text-white/65">
                        {statusLabels[event.fromStatus]}
                        {" → "}
                        {statusLabels[event.toStatus]}
                      </p>
                    )}

                    {event.message && (
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">
                        {event.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {remainingCount > 0 && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + 3)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/65 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <ChevronDown size={16} />
                Muat Lebih Banyak
                <span className="text-xs text-white/35">
                  ({Math.min(remainingCount, 3)} aktivitas lagi)
                </span>
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-white/30">
            Menampilkan {visibleEvents.length} dari {events.length} aktivitas
          </p>
        </>
      )}
    </section>
  );
}
