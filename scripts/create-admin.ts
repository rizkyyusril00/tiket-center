import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, dan ADMIN_PASSWORD harus diisi di .env",
    );
  }

  if (password.length < 12) {
    throw new Error("Password admin minimal 12 karakter.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash,
      isActive: true,
    },
  });

  console.log(`Akun Super Admin berhasil disiapkan: ${email}`);
}

main()
  .catch((error) => {
    console.error("Gagal membuat akun admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
