const PALETTE = [
  "bg-amber-500/20 text-amber-400",
  "bg-teal-500/20 text-teal-400",
  "bg-rose-500/20 text-rose-400",
  "bg-violet-500/20 text-violet-400",
  "bg-sky-500/20 text-sky-400",
];

function colorFor(seed: number) {
  return PALETTE[seed % PALETTE.length];
}

function initials(label: string) {
  const parts = label.trim().split(/\s+/);

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({
  label,
  seed,
  size = "sm",
}: {
  label: string;
  seed: number;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  return (
    <div
      title={label}
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full font-semibold ${colorFor(
        seed,
      )}`}
    >
      {initials(label)}
    </div>
  );
}
