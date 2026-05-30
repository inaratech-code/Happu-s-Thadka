"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  emoji: string;
  imageUrl?: string;
  categoryImageUrl?: string;
  size?: "sm" | "md";
  className?: string;
  /** Preload when this thumb is likely LCP (first visible menu tiles on POS) */
  priority?: boolean;
};

export function MenuItemThumb({
  name,
  emoji,
  imageUrl,
  categoryImageUrl,
  size = "md",
  className,
  priority = false,
}: Props) {
  const [src, setSrc] = useState<string | undefined>(imageUrl ?? categoryImageUrl);

  useEffect(() => {
    setSrc(imageUrl ?? categoryImageUrl);
  }, [imageUrl, categoryImageUrl]);

  const showImage = Boolean(src);

  if (!showImage) {
    return (
      <span
        className={cn(
          "flex items-center justify-center select-none",
          size === "sm"
            ? "text-lg h-8 w-8"
            : "text-2xl aspect-[5/4] w-full max-h-[5.25rem] sm:max-h-[6rem] flex items-center justify-center",
          className
        )}
        aria-hidden
      >
        {emoji}
      </span>
    );
  }

  const dim =
    size === "sm" ? "h-8 w-8" : "aspect-[5/4] w-full max-h-[5.25rem] sm:max-h-[6rem]";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-[var(--muted)] shrink-0",
        dim,
        className
      )}
    >
      <Image
        src={src!}
        alt={name}
        fill
        unoptimized
        priority={priority}
        sizes={size === "sm" ? "32px" : "120px"}
        className="object-cover"
        onError={() => {
          if (src === imageUrl && categoryImageUrl) {
            setSrc(categoryImageUrl);
            return;
          }
          setSrc(undefined);
        }}
      />
    </div>
  );
}
