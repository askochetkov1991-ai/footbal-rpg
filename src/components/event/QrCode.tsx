import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  size?: number;
};

export function QrCode({ value, size = 220 }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0b0f19", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className="animate-pulse rounded-xl bg-white/10"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return <img src={src} alt="QR-код для входа в ивент" width={size} height={size} className="rounded-xl bg-white p-2" />;
}
