import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(
      { categories },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Gagal mengambil kategori:", error);

    return NextResponse.json(
      { message: "Gagal memuat kategori pengaduan." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
