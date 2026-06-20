"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import SupportModal from "./SupportModal";

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-45 flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
        aria-label="Support Solar Undo"
      >
        <Heart className="w-5 h-5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform duration-300" />
        <span className="text-sm font-bold text-foreground">
          <span className="hidden sm:inline">Support Solar Undo</span>
          <span className="sm:hidden">Support</span>
        </span>
      </button>

      <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
