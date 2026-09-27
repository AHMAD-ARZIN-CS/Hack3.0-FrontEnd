/**
 * ============================================================================
 * LOGO: THE ONE PLACE TO CHANGE THE APP LOGO
 * ============================================================================
 * Every screen draws the logo through this file. Search the code for "LOGO:"
 * to see each place it appears (sidebar, phone top bar, sign-in panel, landing).
 *
 * To use a real logo image:
 *   1. Save the file as  public/brand/logo.svg  (or .png). Square works best.
 *      A transparent background is best because the mark sits on white and on blue.
 *   2. Set LOGO_SRC below to "/brand/logo.svg" (the path starts at /public).
 *   3. Browser tab icon: replace  app/favicon.ico  with the same logo
 *      (or add app/icon.png and delete favicon.ico). Next.js picks it up automatically.
 *
 * While LOGO_SRC is null, the placeholder "EB" square is drawn instead.
 * To change the app NAME next to the logo, edit APP_NAME in config/app.ts.
 * ============================================================================
 */
import Image from "next/image";
import { APP_NAME } from "@/config/app";

/** LOGO: set this to your logo file, e.g. "/brand/logo.svg". null = placeholder "EB" square. */
export const LOGO_SRC: string | null = null;

const SIZES = { sm: "size-7 text-xs", md: "size-8 text-sm", lg: "size-9 text-sm" } as const;
const PIXELS = { sm: 28, md: 32, lg: 36 } as const;

/** The square mark alone. "inverted" is for blue backgrounds (sign-in panel). */
export function LogoMark({ size = "md", inverted = false }: { size?: keyof typeof SIZES; inverted?: boolean }) {
  if (LOGO_SRC) {
    return <Image src={LOGO_SRC} alt="" width={PIXELS[size]} height={PIXELS[size]} unoptimized className="shrink-0 rounded-lg" aria-hidden />;
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-lg font-extrabold ${SIZES[size]} ${inverted ? "bg-on-brand text-brand" : "bg-brand text-on-brand"}`}
    >
      EB
    </span>
  );
}

/** Mark plus app name. showName=false hides the name visually but keeps it for screen readers. */
export function LogoLockup({ size = "md", inverted = false, showName = true }: { size?: keyof typeof SIZES; inverted?: boolean; showName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} inverted={inverted} />
      <span className={`font-display font-bold tracking-tight ${showName ? "" : "sr-only"}`}>{APP_NAME}</span>
    </span>
  );
}
