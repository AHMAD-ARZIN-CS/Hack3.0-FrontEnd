import type { Metadata } from "next";
import { NewListingForm } from "./NewListingForm";

export const metadata: Metadata = { title: "List an item" };

export default function NewListingPage() {
  return <NewListingForm />;
}
