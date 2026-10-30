import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_TICKET_ATTEMPTS = 5;
const MAX_REQUEST_BODY_BYTES = 64 * 1024;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForTicketRateLimit = globalThis as typeof globalThis & {
  ticketCreationRateLimit?: Map<string, RateLimitEntry>;
};

const ticketCreationRateLimit =
  globalForTicketRateLimit.ticketCreationRateLimit ??
  new Map<string, RateLimitEntry>();

globalForTicketRateLimit.ticketCreationRateLimit = ticketCreationRateLimit;

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

function checkTicketRateLimit(clientKey: string) {
  const now = Date.now();

  for (const [key, entry] of ticketCreationRateLimit) {
    if (entry.resetAt <= now) {
      ticketCreationRateLimit.delete(key);
    }
  }

  const current = ticketCreationRateLimit.get(clientKey);

  if (!current || current.resetAt <= now) {
    ticketCreationRateLimit.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return { limited: false, retryAfter: 0 };
  }

  if (current.count >= MAX_TICKET_ATTEMPTS) {
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  ticketCreationRateLimit.set(clientKey, current);

  return { limited: false, retryAfter: 0 };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(request: NextRequest) {
  // 1. Batasi jumlah pengiriman.
  const clientKey = getClientKey(request);
  const rateLimit = checkTicketRateLimit(clientKey);

  if (rateLimit.limited) {
    return NextResponse.json(
      {
        message:
          "Terlalu banyak pengaduan dikirim. Silakan coba kembali beberapa saat lagi.",
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

  // 2. Periksa ukuran body berdasarkan Content-Length jika tersedia.
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const parsedLength = Number(contentLength);

    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      return errorResponse("Ukuran permintaan tidak valid.", 400);
    }

    if (parsedLength > MAX_REQUEST_BODY_BYTES) {
      return errorResponse(
        "Ukuran data pengaduan terlalu besar. Maksimal 64 KB.",
        413,
      );
    }
  }

  // 3. Baca body dan periksa ukuran aktual dalam byte.
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return errorResponse("Format permintaan tidak valid.", 400);
  }

  const actualBodySize = new TextEncoder().encode(rawBody).byteLength;

  if (actualBodySize > MAX_REQUEST_BODY_BYTES) {
    return errorResponse(
      "Ukuran data pengaduan terlalu besar. Maksimal 64 KB.",
      413,
    );
  }

  // 4. Parsing JSON.
  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("Format permintaan tidak valid.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Data pengaduan tidak valid.", 400);
  }

  const data = body as Record<string, unknown>;

  const reporterName =
    typeof data.reporterName === "string" ? data.reporterName.trim() : "";

  const reporterEmail =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

  const categoryId =
    typeof data.categoryId === "string" ? data.categoryId.trim() : "";

  const subject = typeof data.subject === "string" ? data.subject.trim() : "";

  const description =
    typeof data.description === "string" ? data.description.trim() : "";

  // 5. Validasi field pengaduan.
  if (
    !reporterName ||
    reporterName.length > 150 ||
    !reporterEmail ||
    reporterEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail) ||
    !categoryId ||
    !subject ||
    subject.length > 200 ||
    !description ||
    description.length > 10000
  ) {
    return errorResponse(
      "Periksa kembali nama, email, kategori, judul, dan detail pengaduan.",
      400,
    );
  }

  try {
    // 6. Pastikan kategori masih aktif.
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!category) {
      return errorResponse(
        "Kategori tidak tersedia atau sudah dinonaktifkan. Silakan muat ulang halaman.",
        400,
      );
    }

    // Hash acak untuk memenuhi skema database.
    // Tidak digunakan sebagai kredensial pelacakan.
    const accessTokenHash = createHash("sha256")
      .update(randomBytes(32))
      .digest("hex");

    // 7. Buat nomor tiket dengan percobaan ulang jika terjadi
    // konflik pada constraint unik.
    for (let attempt = 0; attempt < 3; attempt++) {
      const year = new Date().getFullYear();
      const suffix = randomBytes(4).toString("hex").toUpperCase();
      const ticketNumber = `CC-${year}-${suffix}`;

      try {
        const ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            accessTokenHash,
            reporterName,
            reporterEmail,
            categoryId: category.id,
            subject,
            description,
            status: "BARU",
            events: {
              create: {
                visibility: "REPORTER",
                eventType: "TICKET_CREATED",
                message: "Pengaduan berhasil diterima dan menunggu peninjauan.",
                toStatus: "BARU",
              },
            },
          },
          select: {
            ticketNumber: true,
            status: true,
            createdAt: true,
          },
        });

        return NextResponse.json(
          {
            message: "Pengaduan berhasil dikirim.",
            ticket,
          },
          {
            status: 201,
            headers: { "Cache-Control": "no-store" },
          },
        );
      } catch (error) {
        const isUniqueConflict =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002";

        if (isUniqueConflict && attempt < 2) {
          continue;
        }

        throw error;
      }
    }

    return errorResponse(
      "Nomor tiket gagal dibuat. Silakan coba kembali.",
      500,
    );
  } catch (error) {
    console.error("Gagal membuat pengaduan:", error);

    return errorResponse(
      "Pengaduan gagal disimpan. Silakan coba kembali.",
      500,
    );
  }
}
