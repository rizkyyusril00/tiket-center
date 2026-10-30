import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const statusLabels = {
  BARU: "Baru",
  DITINJAU: "Ditinjau",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITUTUP: "Ditutup",
} as const;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  ticketTrackRateLimit?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  globalForRateLimit.ticketTrackRateLimit ?? new Map<string, RateLimitEntry>();

globalForRateLimit.ticketTrackRateLimit = rateLimitStore;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function getClientKey(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  return "unknown";
}

function checkRateLimit(clientKey: string) {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(clientKey);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      limited: false,
      retryAfter: 0,
    };
  }

  if (current.count >= MAX_ATTEMPTS) {
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimitStore.set(clientKey, current);

  return {
    limited: false,
    retryAfter: 0,
  };
}

export async function POST(request: NextRequest) {
  // 1. Batasi percobaan pelacakan.
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(clientKey);

  if (rateLimit.limited) {
    return NextResponse.json(
      {
        message:
          "Terlalu banyak percobaan pelacakan. Silakan coba kembali beberapa saat lagi.",
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfter),
        },
      },
    );
  }

  // 2. Periksa Content-Length jika tersedia.
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const parsedLength = Number(contentLength);

    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      return errorResponse("Ukuran permintaan tidak valid.", 400);
    }

    if (parsedLength > MAX_REQUEST_BODY_BYTES) {
      return errorResponse(
        "Ukuran permintaan terlalu besar. Maksimal 16 KB.",
        413,
      );
    }
  }

  // 3. Baca body dan periksa ukuran aktual.
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return errorResponse("Format permintaan tidak valid.", 400);
  }

  const bodySize = new TextEncoder().encode(rawBody).byteLength;

  if (bodySize > MAX_REQUEST_BODY_BYTES) {
    return errorResponse(
      "Ukuran permintaan terlalu besar. Maksimal 16 KB.",
      413,
    );
  }

  // 4. Parsing dan validasi bentuk JSON.
  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("Format permintaan tidak valid.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return errorResponse("Data pelacakan tidak valid.", 400);
  }

  const data = body as Record<string, unknown>;

  const ticketNumber =
    typeof data.ticketNumber === "string" ? data.ticketNumber.trim() : "";

  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

  if (
    !ticketNumber ||
    ticketNumber.length > 100 ||
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return errorResponse("Nomor tiket atau email tidak valid.", 400);
  }

  try {
    // 5. Nomor tiket dan email harus cocok.
    // Hanya event REPORTER yang boleh dikembalikan.
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          equals: ticketNumber,
          mode: "insensitive",
        },
        reporterEmail: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        ticketNumber: true,
        subject: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        events: {
          where: {
            visibility: "REPORTER",
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            eventType: true,
            message: true,
            fromStatus: true,
            toStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) {
      return errorResponse(
        "Data pelacakan tidak ditemukan atau tidak sesuai.",
        404,
      );
    }

    return NextResponse.json(
      {
        ticket: {
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status,
          statusLabel: statusLabels[ticket.status],
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          events: ticket.events.map((event) => ({
            eventType: event.eventType,
            message: event.message,
            fromStatus: event.fromStatus,
            toStatus: event.toStatus,
            createdAt: event.createdAt,
          })),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Gagal melakukan pelacakan tiket:", error);

    return errorResponse("Terjadi kesalahan saat melacak tiket.", 500);
  }
}
