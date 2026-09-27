import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Page title with an optional way back to the parent section, so nested pages are never dead ends. */
export function PageHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-4">
      {back && (
        <Link href={back.href} className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand">
          <ArrowLeft aria-hidden className="size-4" /> {back.label}
        </Link>
      )}
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
    </div>
  );
}
