import "dotenv/config";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "../src/lib/prisma";

async function main() {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  const ticketNumber = `CC-TEST-${Date.now()}-${suffix}`;

  // Token acak untuk akses privat tiket.
  // Yang disimpan ke database hanya hash-nya.
  const privateToken = randomBytes(32).toString("hex");
  const accessTokenHash = createHash("sha256")
    .update(privateToken)
    .digest("hex");

  const category = await prisma.category.findFirst({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      accessTokenHash,
      reporterName: "Pelapor Pengujian",
      reporterEmail: "pelapor-test@example.com",
      subject: "[TEST] Pengujian Complaint Center",
      description:
        "Ini adalah tiket pengujian untuk memeriksa halaman daftar tiket, detail tiket, perubahan status, dan catatan internal.",
      status: "BARU",
      ...(category ? { categoryId: category.id } : {}),
      events: {
        create: {
          visibility: "REPORTER",
          eventType: "TICKET_CREATED",
          message: "Tiket pengujian berhasil dibuat di sistem.",
        },
      },
    },
    select: {
      id: true,
      ticketNumber: true,
      status: true,
    },
  });

  console.log("\nTiket pengujian berhasil dibuat:");
  console.log("Nomor tiket:", ticket.ticketNumber);
  console.log("ID tiket:", ticket.id);
  console.log("Status:", ticket.status);
  console.log(
    "Kategori:",
    category ? "Ditentukan otomatis" : "Belum ada kategori aktif",
  );
  console.log("\nBuka halaman:");
  console.log("http://localhost:3000/admin/tickets");
}

main()
  .catch((error) => {
    console.error("Gagal membuat tiket pengujian:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
