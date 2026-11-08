import Link from "next/link";
import { Icon } from "@/components/ui/icon";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:bg-accent-deep",
  secondary: "bg-surface-2 text-ink hover:bg-border",
  ghost: "bg-transparent text-ink hover:bg-surface-2",
};

const SIZES = {
  md: "h-11 px-4 text-button",
  lg: "h-14 px-6 text-body font-semibold",
};

export function buttonClass({ variant = "primary", size = "md", fullWidth = false, className = "" } = {}) {
  return [
    "inline-flex items-center justify-center gap-2 overflow-hidden rounded-base font-semibold transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light",
    "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? "w-full" : "",
    className,
  ].join(" ");
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

function Content({ leadingIcon, loading, children }) {
  return (
    <>
      {loading ? <Spinner /> : leadingIcon ? <Icon name={leadingIcon} size={20} /> : null}
      {children}
    </>
  );
}

export function Button({ variant, size, fullWidth, className, leadingIcon, loading = false, children, disabled, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, fullWidth, className })}
    >
      <Content leadingIcon={leadingIcon} loading={loading}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({ variant, size, fullWidth, className, leadingIcon, children, ...props }) {
  return (
    <Link {...props} className={buttonClass({ variant, size, fullWidth, className })}>
      <Content leadingIcon={leadingIcon}>{children}</Content>
    </Link>
  );
}
