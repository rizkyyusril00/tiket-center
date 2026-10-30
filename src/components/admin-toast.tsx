"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

type AdminToastProps = {
  success?: string;
  error?: string;
};

const successMessages: Record<string, string> = {
  created: "Kategori berhasil ditambahkan.",
  updated: "Kategori berhasil diperbarui.",
  "status-updated": "Status tiket berhasil diperbarui.",
  "note-added": "Catatan internal berhasil ditambahkan.",
  "status-updated-category": "Status kategori berhasil diubah.",
  deleted: "Kategori berhasil dihapus.",
};

const errorMessages: Record<string, string> = {
  "invalid-name": "Nama kategori wajib diisi dan maksimal 100 karakter.",
  "invalid-order": "Urutan harus berupa bilangan bulat minimal 1.",
  "invalid-id": "ID kategori tidak valid.",
  duplicate: "Nama kategori tersebut sudah digunakan.",
  "duplicate-order":
    "Nomor urut sudah digunakan kategori lain. Pilih nomor yang berbeda.",
  "duplicate-data":
    "Nama atau nomor urut kategori bertabrakan dengan data lain.",
  "not-found": "Data tidak ditemukan.",
  "in-use":
    "Kategori tidak dapat dihapus karena sudah digunakan oleh tiket pengaduan.",
  "delete-failed": "Kategori gagal dihapus. Silakan coba kembali.",
  "invalid-status": "Status tiket yang dipilih tidak valid.",
  "invalid-note": "Catatan wajib diisi dan maksimal 5.000 karakter.",
};

export default function AdminToast({ success, error }: AdminToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const lastToastKey = useRef<string | null>(null);

  useEffect(() => {
    const messageType = success ? "success" : error ? "error" : null;
    const messageCode = success || error;

    if (!messageType || !messageCode) return;

    const messages =
      messageType === "success" ? successMessages : errorMessages;

    const message = messages[messageCode];

    if (!message) return;

    const toastKey = `${pathname}:${messageType}:${messageCode}`;

    if (lastToastKey.current === toastKey) return;

    lastToastKey.current = toastKey;

    const toastId = `admin-action-${messageType}-${messageCode}`;

    if (messageType === "success") {
      toast.success(message, {
        id: toastId,
        duration: 3000,
      });
    } else {
      toast.error(message, {
        id: toastId,
        duration: 3000,
      });
    }

    router.replace(pathname, { scroll: false });
  }, [success, error, pathname, router]);

  return null;
}
