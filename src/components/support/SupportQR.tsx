"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface SupportQRProps {
  upiUrl: string;
}

export default function SupportQR({ upiUrl }: SupportQRProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUrl, {
      margin: 1,
      width: 440,
      color: {
        dark: "#1e293b", // slate-800
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code:", err);
      });

    return () => {
      active = false;
    };
  }, [upiUrl]);

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200/60 shadow-inner">
      {qrCodeUrl ? (
        <img
          src={qrCodeUrl}
          alt="Support UPI QR Code"
          className="object-contain w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]"
        />
      ) : (
        <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] bg-slate-100/80 animate-pulse rounded-xl flex items-center justify-center text-sm text-slate-400">
          Generating QR...
        </div>
      )}
    </div>
  );
}
