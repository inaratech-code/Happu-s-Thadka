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
};

export function MenuItemThumb({
  name,
  emoji,
  imageUrl,
  categoryImageUrl,
  size = "md",
  className,
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
          size === "sm" ? "text-lg h-8 w-8" : "text-2xl h-14 w-full",
          className
        )}
        aria-hidden
      >
        {emoji}
      </span>
    );
  }

  const dim = size === "sm" ? "h-8 w-8" : "h-14 w-full";

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
