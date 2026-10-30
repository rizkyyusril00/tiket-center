"use server";

import { requireActiveAdmin } from "../../../../lib/require-admin";
import { prisma } from "../../../../lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TicketStatus } from "../../../../generated/prisma/client";

const allowedStatuses: TicketStatus[] = [
  "BARU",
  "DITINJAU",
  "DIPROSES",
  "SELESAI",
  "DITUTUP",
];

const statusLabels: Record<TicketStatus, string> = {
  BARU: "Baru",
  DITINJAU: "Ditinjau",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITUTUP: "Ditutup",
};

export async function updateTicketStatus(id: string, formData: FormData) {
  const admin = await requireActiveAdmin();

  const statusValue = String(formData.get("status") ?? "");

  if (!allowedStatuses.includes(statusValue as TicketStatus)) {
    redirect(`/admin/tickets/${id}?error=invalid-status`);
  }

  const newStatus = statusValue as TicketStatus;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!ticket) {
    redirect("/admin/tickets?error=not-found");
  }

  if (ticket.status === newStatus) {
    redirect(`/admin/tickets/${id}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    await tx.ticketEvent.create({
      data: {
        ticketId: id,
        visibility: "REPORTER",
        eventType: "STATUS_CHANGED",
        message: `Status tiket berubah dari "${statusLabels[ticket.status]}" menjadi "${statusLabels[newStatus]}".`,
        fromStatus: ticket.status,
        toStatus: newStatus,
        actorAdminId: admin.id,
      },
    });
  });

  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${id}`);

  redirect(`/admin/tickets/${id}?success=status-updated`);
}

export async function addInternalNote(id: string, formData: FormData) {
  const admin = await requireActiveAdmin();

  const message = String(formData.get("message") ?? "").trim();
  const visibilityValue = String(formData.get("visibility") ?? "INTERNAL");

  if (!message || message.length > 5000) {
    redirect(`/admin/tickets/${id}?error=invalid-note`);
  }

  if (visibilityValue !== "INTERNAL" && visibilityValue !== "REPORTER") {
    redirect(`/admin/tickets/${id}?error=invalid-visibility`);
  }

  const visibility = visibilityValue === "REPORTER" ? "REPORTER" : "INTERNAL";

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!ticket) {
    redirect("/admin/tickets?error=not-found");
  }

  await prisma.ticketEvent.create({
    data: {
      ticketId: id,
      visibility,
      eventType: visibility === "REPORTER" ? "REPORTER_NOTE" : "INTERNAL_NOTE",
      message,
      actorAdminId: admin.id,
    },
  });

  revalidatePath(`/admin/tickets/${id}`);
  revalidatePath("/admin/tickets");

  redirect(`/admin/tickets/${id}?success=note-added`);
}
