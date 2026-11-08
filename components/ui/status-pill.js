import { Icon } from "@/components/ui/icon";

// The text carries the meaning; the dot and colour only reinforce it.
export function StatusPill({ published }) {
  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full px-3 text-small">
      <Icon name={published ? "dot-published" : "dot-draft"} size={8} />
      <span className={published ? "text-success" : "text-warning"}>{published ? "Published" : "Draft"}</span>
    </span>
  );
}
