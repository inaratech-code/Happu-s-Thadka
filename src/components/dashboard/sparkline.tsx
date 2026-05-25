"use client";

import { cn } from "@/lib/utils";

export function Sparkline({
  data,
  className,
  stroke = "var(--chart-primary)",
  fill = "var(--chart-primary-fill)",
}: {
  data: number[];
  className?: string;
  stroke?: string;
  fill?: string;
}) {
  const w = 120;
  const h = 36;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const line = points.join(" ");
  const area = `${line} ${w},${h} 0,${h}`;

  if (data.every((v) => v === 0)) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full h-9 opacity-30", className)} aria-hidden>
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={stroke} strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full h-9", className)} aria-hidden>
      <polygon points={area} fill={fill} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
