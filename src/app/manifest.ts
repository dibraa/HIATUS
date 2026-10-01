import type { MetadataRoute } from "next";

/**
 * Web app manifest. Makes Hiatus installable ("Add to Home Screen"), which on
 * iPhone and iPad is the only way a site can receive push notifications
 * (iOS 16.4+). `standalone` opens it without browser chrome, like an app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hiatus Coffee",
    short_name: "Hiatus",
    description: "Order coffee ahead and get told when it's ready.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#efe9de",
    theme_color: "#efe9de",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
