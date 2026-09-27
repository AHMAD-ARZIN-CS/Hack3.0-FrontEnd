import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { APP_NAME, APP_TAGLINE } from "@/config/app";
import { CampusProvider } from "@/context/CampusContext";

/*
 * FONTS: change the app's fonts here (one place). Self-hosted at build time by next/font,
 * so pages make no runtime request to Google.
 * Headings: Fraunces, a warm modern serif. Only 600/700 are loaded on purpose: heavier
 * serif headings look crowded, so "font-extrabold" classes render at 700.
 * Body, posts, controls, metadata: Figtree, a friendly readable sans.
 */
const body = Figtree({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const display = Fraunces({ variable: "--font-heading", subsets: ["latin"], weight: ["600", "700"], display: "swap" });

// LOGO: app icons live in app/favicon.ico (browser tab), app/apple-icon.png (iPhone home screen),
// and public/icons/ (Android / install). Replace those files to change them.
export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
  // iPhone "Add to Home Screen": opens full screen like an app, with its own name under the icon.
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b0450f",
  // Lets the layout reach the rounded screen edges. Bottom tabs and the top bar pad themselves
  // with env(safe-area-inset-*) so nothing sits under the notch or the home bar.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} antialiased`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-2"
        >
          Skip to content
        </a>
        <CampusProvider>
          {/* Chrome + auth gate per route (D33) */}
          <AppShell>{children}</AppShell>
        </CampusProvider>
      </body>
    </html>
  );
}
