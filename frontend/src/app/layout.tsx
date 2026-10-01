import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PrototypeBanner from "@/components/PrototypeBanner";
import Toasts from "@/components/Toasts";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "UTG Digital Student Services",
  description: "Prototype — Not an official UTG service.",
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem("utg-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <AuthProvider>
          <PrototypeBanner />
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
          <footer className="border-t border-line bg-surface py-6 text-center text-xs text-muted">
            Prototype — Not an official UTG service. © 2026 UTG Digital Student Services
          </footer>
          <Toasts />
        </AuthProvider>
      </body>
    </html>
  );
}
