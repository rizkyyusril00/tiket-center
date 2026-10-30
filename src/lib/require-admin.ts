import "server-only";
import { auth } from "../../auth";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

export async function requireActiveAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const admin = await prisma.admin.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    redirect("/login");
  }

  return admin;
}
