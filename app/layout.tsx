import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["600", "800"] });

export const metadata: Metadata = {
  title: { default: "Shark Tank Simulator", template: "%s | Shark Tank Simulator" },
  description:
    "Pitch your startup to a panel of four AI investors powered by Gemini. Survive hard questions, negotiate offers and leave with a stronger pitch.",
};

export const viewport: Viewport = { themeColor: "#020617" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="stage-glow flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-amber-300 px-4 py-2 font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to main content
        </a>
        {children}
        <footer className="mt-auto border-t border-slate-800 px-4 py-6 text-center text-sm text-slate-400">
          Built with the Gemini API on Google Cloud Run. The sharks are AI characters; their offers are practice, not investment advice.
        </footer>
      </body>
    </html>
  );
}
