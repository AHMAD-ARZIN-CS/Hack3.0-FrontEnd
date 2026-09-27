import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-10 text-center">
      <h1 className="text-2xl font-extrabold">Page not found</h1>
      <Link href="/" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">
        Go home
      </Link>
    </div>
  );
}
