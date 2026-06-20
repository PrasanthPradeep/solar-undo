"use client";

import { useState, useEffect } from "react";
import { SUPPORT_CONFIG, SupportTier } from "@/config/support";

interface AmountSelectorProps {
  selectedAmount: number | undefined;
  onChange: (amount: number | undefined) => void;
}

export default function AmountSelector({ selectedAmount, onChange }: AmountSelectorProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [customVal, setCustomVal] = useState<string>("");

  const handleTierClick = (tier: SupportTier) => {
    if (selectedTierId === tier.id) {
      // Toggle off
      setSelectedTierId(null);
      onChange(undefined);
    } else {
      setSelectedTierId(tier.id);
      if (tier.amount !== undefined) {
        onChange(tier.amount);
      } else {
        // Custom support selected
        const parsed = parseInt(customVal, 10);
        onChange(isNaN(parsed) || parsed <= 0 ? undefined : parsed);
      }
    }
  };

  const handleCustomChange = (val: string) => {
    setCustomVal(val);
    const parsed = parseInt(val, 10);
    onChange(isNaN(parsed) || parsed <= 0 ? undefined : parsed);
  };

  // Sync tier when amount changes
  useEffect(() => {
    if (selectedAmount === undefined) {
      if (selectedTierId !== "custom") {
        setSelectedTierId(null);
      }
    } else {
      const match = SUPPORT_CONFIG.tiers.find(
        (t) => t.amount !== undefined && t.amount === selectedAmount
      );
      if (match) {
        setSelectedTierId(match.id);
      } else {
        setSelectedTierId("custom");
        setCustomVal(String(selectedAmount));
      }
    }
  }, [selectedAmount]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
          Select Support Option
        </label>
        <div className="flex flex-col gap-2">
          {SUPPORT_CONFIG.tiers.map((tier) => {
            const active = selectedTierId === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => handleTierClick(tier)}
                className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  active
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/70 hover:border-border/80"
                }`}
              >
                {/* Emoji Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted text-xl">
                  {tier.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">
                    {tier.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tier.description}
                  </div>
                </div>

                {/* Amount badge */}
                <div className="text-sm font-extrabold text-primary">
                  {tier.amount !== undefined ? `₹${tier.amount}` : "Custom"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Amount input */}
      {selectedTierId === "custom" && (
        <div className="space-y-1.5 animate-accordion-down">
          <label htmlFor="custom-amount" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Custom Amount (₹)
          </label>
          <input
            id="custom-amount"
            type="number"
            min="1"
            placeholder="Enter amount"
            value={customVal}
            onChange={(e) => handleCustomChange(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className="input-premium w-full rounded-xl px-4 py-2.5 text-sm font-medium"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
