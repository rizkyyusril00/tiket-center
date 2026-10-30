"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 pr-12 text-sm outline-none transition placeholder:text-white/30 focus:border-[#F70000]/30 focus:ring-2 focus:ring-[#F70000]/30"
        placeholder="Masukkan password"
      />

      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        aria-label={
          showPassword ? "Sembunyikan password" : "Tampilkan password"
        }
        aria-pressed={showPassword}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-white/50 transition hover:text-white focus-visible:outline-2 focus-visible:outline-[#F70000]"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
