import Image from "next/image";

import solarUndoLogo from "@/components/solarundo-logo.png";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-34 w-34 rounded-2xl p-1.5",
  md: "h-36 w-36 rounded-2xl p-1.5",
  lg: "h-40 w-40 rounded-[1.35rem] p-0",
};

const imageSizes = {
  sm: 440,
  md: 520,
  lg: 640,
};

export default function AppLogo({ size = "md", className = "" }: AppLogoProps) {
  const imageSize = imageSizes[size];

  return (
    <div
      className={`inline-flex items-center justify-center bg-white shadow-lg ring-1 ring-orange-200/70 ${sizeClasses[size]} ${className}`}
    >
      <Image
        src={solarUndoLogo}
        alt="Solar Slot ഉണ്ടോ?"
        width={imageSize}
        height={imageSize}
        priority={size === "lg"}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
