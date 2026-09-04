import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-500 bg-ink-800/40 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-700 text-amber-400">
        <Icon size={22} />
      </div>
      <h3 className="font-display text-base font-semibold text-mist-100">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-mist-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
