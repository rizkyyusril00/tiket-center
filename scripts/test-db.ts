import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.$queryRaw<{ result: number }[]>`
    SELECT 1 AS result
  `;

  console.log("Koneksi PostgreSQL berhasil!");
  console.log("Hasil query:", result);
}

main()
  .catch((error) => {
    console.error("Tes database gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
