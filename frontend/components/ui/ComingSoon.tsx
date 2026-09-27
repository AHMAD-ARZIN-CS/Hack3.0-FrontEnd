import Link from "next/link";
import { Hammer } from "lucide-react";
import { PageHeader } from "./PageHeader";

/** Placeholder for routes not built yet, so navigation never 404s during the demo. */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} subtitle={description} />
      <div className="rounded-2xl border border-dashed border-line p-6 text-center">
        <Hammer aria-hidden className="mx-auto size-6 text-ink-soft" />
        <p className="mt-2 font-semibold">Being built now</p>
        <p className="mt-1 text-sm text-ink-soft">Meanwhile, check campus resources.</p>
        <Link
          href="/resources"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand"
        >
          Browse resources
        </Link>
      </div>
    </>
  );
}
