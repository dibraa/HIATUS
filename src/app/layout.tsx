import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  // Text stays visible in a fallback face while the webfont loads, instead of
  // flashing invisible — the usual cause of a slow-feeling first paint.
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hiatus Coffee — order ahead, skip the line",
    template: "%s | Hiatus Coffee",
  },
  description:
    "Order coffee ahead from Hiatus and pick it up without queueing. Pay cash on pickup.",
};

/**
 * Paints the browser chrome (mobile address bar) to match the active theme.
 * Two entries, each with a media query, so the OS preference is honoured for
 * anyone who has not pressed the toggle.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5ead8" },
    { media: "(prefers-color-scheme: dark)", color: "#14120e" },
  ],
};

/**
 * Applies a stored theme override BEFORE first paint.
 *
 * This has to be a blocking inline script in <head>. Anything later — an
 * effect, a deferred script — runs after the browser has already painted the
 * default theme, which is the white flash every hand-rolled dark mode is
 * known for. It is deliberately tiny and dependency-free for that reason.
 *
 * Absence of the key means "follow the OS", which the CSS handles on its own,
 * so the script writes nothing in that case.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("hiatus-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    // suppressHydrationWarning: the script above legitimately mutates <html>
    // before React hydrates, so the attribute set will not match the server's.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <Providers>
          {/* First tab stop on every page: jumps the header nav straight to content */}
          <a href="#main" className="skip-link">
            Skip to main content
          </a>

          <div className="site-chrome">{!isAdminRoute && <Navbar />}</div>

          <main
            id="main"
            className={
              isAdminRoute
                ? "w-full flex-1"
                : "mx-auto w-full max-w-6xl flex-1 px-4 py-8"
            }
          >
            {children}
          </main>

          <div className="site-chrome">{!isAdminRoute && <SiteFooter />}</div>
        </Providers>
      </body>
    </html>
  );
}
