import type { Metadata } from "next";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <Providers>
          {/* First tab stop on every page: jumps the header nav straight to content */}
          <a href="#main" className="skip-link">
            Skip to main content
          </a>

          <Navbar />

          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>

          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
