"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, ExternalLink, Heart } from "lucide-react";
import { SUPPORT_CONFIG } from "@/config/support";
import { generateUpiUrl } from "@/lib/generate-upi-url";
import { trackEvent } from "@/lib/analytics";
import SupportQR from "./SupportQR";
import AmountSelector from "./AmountSelector";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Stats {
  transformersIndexed: number;
  sectionsIndexed: number;
  districtsIndexed: number;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<Stats>({
    transformersIndexed: 96790,
    sectionsIndexed: 774,
    districtsIndexed: 14,
  });

  // Fetch live stats when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    trackEvent("support_modal_opened");

    fetch("/api/coverage-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.available) {
          setStats({
            transformersIndexed: data.transformersIndexed || 96790,
            sectionsIndexed: data.sectionsIndexed || 774,
            districtsIndexed: data.districtsIndexed || 14,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load live coverage stats:", err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const upiUrl = generateUpiUrl(amount);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPPORT_CONFIG.upiId);
    setCopied(true);
    trackEvent("support_upi_copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenApp = () => {
    trackEvent("support_upi_app_opened", { amount: amount ?? 0 });
    window.location.href = upiUrl;
  };

  const handleAmountChange = (newAmount: number | undefined) => {
    setAmount(newAmount);
    if (newAmount) {
      trackEvent("support_amount_selected", { amount: newAmount });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto bg-card border border-border rounded-3xl shadow-2xl p-5 sm:p-6 transition-all duration-300 scale-100 z-10 flex flex-col gap-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-primary rounded-full text-sm font-bold">
            <Heart className="w-4 h-4 fill-current text-amber-500" />
            <span>Fuel Solar Undo</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
            Help keep Solar Undo free and updated for everyone.
          </p>
        </div>

        {/* Database Stats */}
        <div className="grid grid-cols-3 gap-2 bg-muted/50 border border-border/60 rounded-2xl p-3 text-center">
          <div>
            <div className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {stats.transformersIndexed.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              Transformers
            </div>
          </div>
          <div className="border-x border-border/80">
            <div className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {stats.sectionsIndexed.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              Sections
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {stats.districtsIndexed.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              Districts
            </div>
          </div>
        </div>

        {/* QR Code and message */}
        <div className="flex flex-col items-center gap-2">
          <SupportQR upiUrl={upiUrl} />
          <p className="text-center text-xs text-muted-foreground max-w-[285px] leading-normal mt-1">
            Every contribution helps keep Solar Undo free for Kerala solar applicants ❤️
          </p>
        </div>
        
        {/* Amount Selector */}
        <AmountSelector selectedAmount={amount} onChange={handleAmountChange} />

        {/* Selected Tier Status */}
        {(() => {
          const selectedTier = SUPPORT_CONFIG.tiers.find(
            (t) =>
              (t.amount !== undefined && t.amount === amount) ||
              (t.amount === undefined && amount !== undefined && !SUPPORT_CONFIG.tiers.some(x => x.amount === amount))
          ) || (amount !== undefined ? SUPPORT_CONFIG.tiers.find(x => x.id === "custom") : null);

          if (amount === undefined || !selectedTier) return null;

          return (
            <div className="text-center text-sm font-bold text-primary bg-primary/5 border border-primary/20 py-2 px-4 rounded-xl">
              Selected: {selectedTier.emoji} {selectedTier.name} (₹{amount})
            </div>
          );
        })()}

        {/* Payment Actions */}
        <div className="space-y-3">
          {/* UPI ID display */}
          <div className="flex items-center justify-between gap-2 bg-muted border border-border rounded-xl px-3 py-2 text-sm font-semibold">
            <span className="text-muted-foreground select-all truncate">
              {SUPPORT_CONFIG.upiId}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-primary hover:text-primary-foreground hover:bg-primary px-2.5 py-1 rounded-lg transition-all duration-200 text-xs font-bold cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleOpenApp}
            className="w-full btn-solar rounded-xl py-3.5 text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open UPI App</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
