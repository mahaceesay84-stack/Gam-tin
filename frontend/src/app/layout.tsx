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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <PrototypeBanner />
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="py-6 text-center text-xs text-gray-500">
            Prototype — Not an official UTG service.
          </footer>
          <Toasts />
        </AuthProvider>
      </body>
    </html>
  );
}
