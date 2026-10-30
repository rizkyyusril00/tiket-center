"use server";

import { requireActiveAdmin } from "../../../lib/require-admin";
import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getCategoryInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const rawSortOrder = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = Number(rawSortOrder);

  if (!name || name.length > 100) {
    redirect("/admin/categories?error=invalid-name");
  }

  if (rawSortOrder === "" || !Number.isInteger(sortOrder) || sortOrder < 1) {
    redirect("/admin/categories?error=invalid-order");
  }

  return { name, description, sortOrder };
}

function getUniqueTarget(error: unknown): string {
  if (typeof error !== "object" || error === null || !("meta" in error)) {
    return "";
  }

  const meta = error.meta;

  if (typeof meta !== "object" || meta === null || !("target" in meta)) {
    return "";
  }

  const target = meta.target;

  if (Array.isArray(target)) {
    return target.join(" ");
  }

  return typeof target === "string" ? target : "";
}

function handleUniqueConstraintError(error: unknown): never {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2002"
  ) {
    throw error;
  }

  const target = getUniqueTarget(error);

  if (target.includes("sortOrder")) {
    redirect("/admin/categories?error=duplicate-order");
  }

  if (target.includes("name")) {
    redirect("/admin/categories?error=duplicate");
  }

  redirect("/admin/categories?error=duplicate-data");
}

async function ensureUniqueSortOrder(sortOrder: number, excludeId?: string) {
  const existingCategory = await prisma.category.findFirst({
    where: {
      sortOrder,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existingCategory) {
    redirect("/admin/categories?error=duplicate-order");
  }
}

export async function createCategory(formData: FormData) {
  await requireActiveAdmin();

  const data = getCategoryInput(formData);

  await ensureUniqueSortOrder(data.sortOrder);

  try {
    await prisma.category.create({ data });
  } catch (error) {
    handleUniqueConstraintError(error);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  redirect("/admin/categories?success=created");
}

export async function updateCategory(formData: FormData) {
  await requireActiveAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/admin/categories?error=invalid-id");
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingCategory) {
    redirect("/admin/categories?error=not-found");
  }

  const data = getCategoryInput(formData);

  await ensureUniqueSortOrder(data.sortOrder, id);

  try {
    await prisma.category.update({
      where: { id },
      data,
    });
  } catch (error) {
    handleUniqueConstraintError(error);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  redirect("/admin/categories?success=updated");
}

export async function toggleCategory(formData: FormData) {
  await requireActiveAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/admin/categories?error=invalid-id");
  }

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    redirect("/admin/categories?error=not-found");
  }

  await prisma.category.update({
    where: { id },
    data: { isActive: !category.isActive },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  redirect("/admin/categories?success=status-updated");
}

export async function deleteCategory(formData: FormData) {
  await requireActiveAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/admin/categories?error=invalid-id");
  }

  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!category) {
    redirect("/admin/categories?error=not-found");
  }

  const ticketCount = await prisma.ticket.count({
    where: { categoryId: id },
  });

  if (ticketCount > 0) {
    redirect("/admin/categories?error=in-use");
  }

  try {
    await prisma.category.delete({
      where: { id },
    });
  } catch (error) {
    // Perlindungan tambahan jika kategori terhubung dengan tiket
    // pada saat yang sama dengan proses penghapusan.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "P2003" || error.code === "P2014")
    ) {
      redirect("/admin/categories?error=in-use");
    }

    throw error;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin");
  redirect("/admin/categories?success=deleted");
}
