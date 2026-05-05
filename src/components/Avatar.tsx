"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

function getAvatarFallbackLabel(alt: string) {
  const trimmed = alt.trim();
  return trimmed ? trimmed.slice(0, 1) : "?";
}

export default function Avatar({ src, alt, size = 40, round = true }: { src: string; alt: string; size?: number; round?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackLabel = useMemo(() => getAvatarFallbackLabel(alt), [alt]);

  return (
    <div
      className="flex-shrink-0 overflow-hidden bg-[#eef3f8] text-[#5b6b7f] flex items-center justify-center"
      style={{ width: size, height: size, borderRadius: round ? "50%" : 8 }}
      aria-label={alt}
    >
      {imageFailed ? (
        <span
          aria-hidden="true"
          className="select-none font-semibold"
          style={{ fontSize: Math.max(12, Math.round(size * 0.36)), lineHeight: 1 }}
        >
          {fallbackLabel}
        </span>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="object-cover"
          style={{ width: size, height: size }}
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}
