import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@/config/app";

/** Install info for phones: name, icon, and full-screen launch from the home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#b0450f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
