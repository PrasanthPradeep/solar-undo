import Link from "next/link";
import { AtSign, Code2, Globe2 } from "lucide-react";

const creatorLinks = [
  {
    label: "Portfolio",
    href: "https://prasanthp.tech",
    icon: Globe2,
  },
  {
    label: "GitHub",
    href: "https://github.com/PrasanthPradeep",
    icon: Code2,
  },
  {
    label: "X",
    href: "https://x.com/PrasanthPradeep",
    icon: AtSign,
  },
] as const;

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/70 bg-[oklch(0.62_0.19_55_/_0.07)] px-4 py-3 backdrop-blur-sm sm:px-8 lg:px-12">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-bold text-foreground">Solar Undo?</p>
            <span className="hidden text-muted-foreground sm:inline">•</span>
            <p className="text-xs text-muted-foreground">
              Check KSEB rooftop solar capacity with transformer-level accuracy.  <span className="hidden text-muted-foreground sm:inline">•</span>  Not affiliated with KSEB. Data may change without notice. © 2026 Solar Undo
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Use
            </Link>
            <span>•</span>
            <a href="mailto:contact@prasanthp.tech" className="hover:text-primary transition-colors">
              Contact
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <p className="text-xs font-semibold text-foreground">Made with ❤️ in Keralam by Prasanth P</p>
          <div className="flex flex-nowrap items-center gap-3">
            {creatorLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
