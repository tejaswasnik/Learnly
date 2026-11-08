import { Icon } from "@/components/ui/icon";

export function EmptyState({ icon = "search-empty", title, message, children }) {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-4 rounded-base border border-dashed border-border p-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface-2">
        <Icon name={icon} size={32} />
      </span>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-small text-muted">{message}</p>
      {children}
    </div>
  );
}
