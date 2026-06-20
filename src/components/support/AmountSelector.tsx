"use client";

interface AmountSelectorProps {
  selectedAmount: number | undefined;
  onChange: (amount: number | undefined) => void;
}

export default function AmountSelector({ selectedAmount, onChange }: AmountSelectorProps) {
  const suggestions = [50, 100, 250];

  const handleCustomChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      onChange(undefined);
    } else {
      onChange(num);
    }
  };

  const isSuggested = selectedAmount !== undefined && suggestions.includes(selectedAmount);
  const customValue = isSuggested || selectedAmount === undefined ? "" : selectedAmount;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Suggested Amounts
        </label>
        <div className="grid grid-cols-3 gap-2">
          {suggestions.map((amt) => {
            const active = selectedAmount === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => onChange(active ? undefined : amt)}
                className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card hover:bg-muted text-foreground"
                }`}
              >
                ₹{amt}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="custom-amount" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Custom Amount (₹)
        </label>
        <input
          id="custom-amount"
          type="number"
          min="1"
          placeholder="Enter custom amount"
          value={customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          className="input-premium w-full rounded-xl px-4 py-2.5 text-sm font-medium"
        />
      </div>
    </div>
  );
}
