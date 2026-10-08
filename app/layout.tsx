import type { Metadata, Viewport } from "next";
import { Funnel_Display, Funnel_Sans } from "next/font/google";
import "./globals.css";

// The same pair as the finale deck, so the app and the slides read as one product.
const funnelSans = Funnel_Sans({ variable: "--font-funnel-sans", subsets: ["latin"] });
const funnelDisplay = Funnel_Display({ variable: "--font-funnel-display", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Shark Tank Simulator", template: "%s | Shark Tank Simulator" },
  description:
    "Pitch your startup to a panel of four AI investors powered by Gemini. Survive hard questions, negotiate offers and leave with a stronger pitch.",
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#16181c" }] };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${funnelSans.variable} ${funnelDisplay.variable} h-full antialiased`}>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded-(--radius-control) bg-accent px-4 py-2 font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
