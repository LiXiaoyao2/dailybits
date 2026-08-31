import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: "book" | "tea" | "reader";
  action?: { label: string; href: string };
  variant?: "default" | "compact";
}

function EmptyIllustration({
  type,
  compact,
}: {
  type: NonNullable<EmptyStateProps["illustration"]>;
  compact: boolean;
}) {
  const className = compact ? "h-11 w-20" : "h-16 w-28";

  if (type === "tea") {
    return (
      <svg viewBox="0 0 160 96" className={cn(className, "text-accent/80")} fill="none">
        <path d="M24 57h78a14 14 0 0 1 0 28H44a20 20 0 0 1-20-20V57Z" stroke="currentColor" strokeWidth="2.4" />
        <path d="M102 61h17c9 0 17 8 17 17s-8 17-17 17h-9" stroke="currentColor" strokeWidth="2.4" />
        <path d="M37 46h52" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M52 22c-5 8 5 10 0 18M72 20c-5 8 5 10 0 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "reader") {
    return (
      <svg viewBox="0 0 160 96" className={cn(className, "text-primary/80")} fill="none">
        <circle cx="48" cy="24" r="10" stroke="currentColor" strokeWidth="2.4" />
        <path d="M35 60c0-10 7-18 17-18s17 8 17 18v24H35V60Z" stroke="currentColor" strokeWidth="2.4" />
        <path d="M78 40l40-7a8 8 0 0 1 9 8v35a8 8 0 0 1-6 7l-40 9a6 6 0 0 1-7-6V46a6 6 0 0 1 4-6Z" stroke="currentColor" strokeWidth="2.4" />
        <path d="M90 52l26-4M90 64l26-4M90 76l16-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 96" className={cn(className, "text-primary/75")} fill="none">
      <path d="M18 25a10 10 0 0 1 10-10h44a20 20 0 0 1 20 20v42a6 6 0 0 1-6 6H34a16 16 0 0 1-16-16V25Z" stroke="currentColor" strokeWidth="2.4" />
      <path d="M142 25a10 10 0 0 0-10-10H88a20 20 0 0 0-20 20v42a6 6 0 0 0 6 6h52a16 16 0 0 0 16-16V25Z" stroke="currentColor" strokeWidth="2.4" />
      <path d="M80 35v44" stroke="currentColor" strokeWidth="2.4" />
      <path d="M36 43h32M36 53h24M92 43h32M92 53h22" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  illustration = "book",
  action,
  variant = "default",
}: EmptyStateProps) {
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "empty-slate flex flex-col items-center justify-center px-4 text-center",
        compact ? "py-7" : "py-12",
      )}
    >
      <EmptyIllustration type={illustration} compact={compact} />
      <h3 className={cn("mt-3 font-semibold text-foreground", compact ? "text-base" : "text-lg")}>
        {title}
      </h3>
      <p className={cn("mt-2 max-w-sm text-muted-foreground", compact ? "text-xs leading-5" : "text-sm")}>
        {description}
      </p>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "inline-flex items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
            compact ? "mt-4 h-8" : "mt-5 h-8",
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
