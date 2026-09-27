import type { Metadata } from "next";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Join your campus" };

export default function SignUpPage() {
  return <SignUpForm />;
}
