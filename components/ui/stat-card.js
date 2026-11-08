import { Icon } from "@/components/ui/icon";

export function StatCard({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-3 rounded-base bg-surface p-6">
      <div className="flex items-center justify-between">
        <p className="text-small text-muted">{label}</p>
        <Icon name={icon} size={24} />
      </div>
      <p className="text-h2 tabular-nums text-ink">{value}</p>
    </div>
  );
}
