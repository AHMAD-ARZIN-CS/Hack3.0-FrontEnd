import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SafetyList } from "./SafetyList";

export const metadata: Metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <>
      <PageHeader title="Safety" subtitle="Official safety contacts and reporting channels in one place." back={{ href: "/discover", label: "Discover" }} />

      <div className="mb-5 rounded-2xl bg-danger p-4 text-white">
        <p className="text-lg font-extrabold">In danger right now?</p>
        <p className="mt-0.5 text-sm">East Bay Link is not an emergency service.</p>
        <a
          href="tel:911"
          className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-extrabold text-danger"
        >
          <Phone aria-hidden className="size-5" /> Call 911
        </a>
      </div>

      <SafetyList />
    </>
  );
}
