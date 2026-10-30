"use client";

import { useEffect, useState } from "react";
import { createCategory } from "./actions";
import { Plus, X } from "lucide-react";

export default function CreateCategoryModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#F70000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        <Plus size={18} />
        Tambah Kategori
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-category-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2
                  id="create-category-title"
                  className="text-lg font-semibold"
                >
                  Tambah Kategori
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Masukkan informasi kategori pengaduan baru.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup modal"
                className="rounded-lg p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form action={createCategory} className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="modal-category-name"
                  className="mb-2 block text-sm text-white/75"
                >
                  Nama kategori <span className="text-[#F70000]">*</span>
                </label>
                <input
                  id="modal-category-name"
                  name="name"
                  type="text"
                  maxLength={100}
                  required
                  autoFocus
                  placeholder="Contoh: Pelayanan"
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-[#F70000]/50 focus:ring-2 focus:ring-[#F70000]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-category-description"
                  className="mb-2 block text-sm text-white/75"
                >
                  Deskripsi
                </label>
                <textarea
                  id="modal-category-description"
                  name="description"
                  rows={3}
                  placeholder="Jelaskan jenis pengaduan untuk kategori ini."
                  className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[#F70000]/50 focus:ring-2 focus:ring-[#F70000]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-category-order"
                  className="mb-2 block text-sm text-white/75"
                >
                  Urutan tampil
                </label>
                <input
                  id="modal-category-order"
                  name="sortOrder"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={1}
                  required
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-[#F70000]/50 focus:ring-2 focus:ring-[#F70000]/20"
                />
                <p className="mt-2 text-xs text-white/35">
                  Gunakan angka positif yang belum dipakai kategori lain.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#F70000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
