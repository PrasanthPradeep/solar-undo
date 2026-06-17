import AppLogo from "./AppLogo";

export default function Header() {
  return (
    <header className="flex items-center gap-3">
      <AppLogo size="sm" />
      <div>
        <p className="text-base font-extrabold tracking-tight">
          Solar Slot <span style={{ color: "var(--primary)" }}>ഉണ്ടോ?</span>
        </p>
        <p className="text-xs text-muted-foreground">
          KSEB transformer capacity checker
        </p>
      </div>
    </header>
  );
}
