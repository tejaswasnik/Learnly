import { createElement } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";

// Toasts styled after the Toast component in the design: title, optional message, close button.
function card(id, { title, message, icon }) {
  return createElement(
    "div",
    {
      role: icon === "toast-error" ? "alert" : "status",
      className:
        "flex w-[min(420px,calc(100vw-32px))] items-center gap-3 rounded-base bg-surface-2 py-3 pl-4 pr-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
    },
    createElement(Icon, { name: icon, size: 24 }),
    createElement(
      "div",
      { className: "min-w-0 flex-1" },
      createElement("p", { className: "font-semibold text-ink" }, title),
      message ? createElement("p", { className: "text-small text-muted" }, message) : null,
    ),
    createElement(
      "button",
      {
        type: "button",
        "aria-label": "Dismiss",
        onClick: () => toast.dismiss(id),
        className:
          "inline-flex size-11 shrink-0 items-center justify-center rounded-base hover:bg-border focus-visible:outline-2 focus-visible:outline-accent-light",
      },
      createElement(Icon, { name: "close-sm", size: 20 }),
    ),
  );
}

export const notify = {
  error(title, message) {
    return toast.custom((id) => card(id, { title, message, icon: "toast-error" }), { duration: 6000 });
  },
  success(title, message) {
    return toast.custom((id) => card(id, { title, message, icon: "check" }), { duration: 4000 });
  },
};
