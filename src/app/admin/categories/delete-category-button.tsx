"use client";

import { useState, useTransition } from "react";
import { Trash2, LoaderCircle } from "lucide-react";
import { deleteCategory } from "./actions";

export default function DeleteCategoryButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      await deleteCategory(formData);
      setConfirming(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        aria-label={`Hapus kategori ${name}`}
        title="Hapus kategori"
        className="inline-flex size-10 items-center justify-center rounded-lg border border-red-500/25 text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={17} />
      </button>

      {confirming && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <Trash2 size={20} />
              </div>

              <div>
                <h2
                  id="delete-category-title"
                  className="text-lg font-semibold text-white"
                >
                  Hapus kategori?
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  Kamu akan menghapus kategori{" "}
                  <span className="font-medium text-white">{name}</span>.
                  Kategori yang sudah digunakan tiket pengaduan tidak dapat
                  dihapus.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-[#F70000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
