import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "MediLifetime — Lifetime Patient Medical Record System",
  description: "Secure lifetime medical history, timeline, audit trail. ABDM-ready. No billing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-3 sm:px-6 pb-16 pt-4 sm:pt-6"><AuthGate>{children}</AuthGate></main>
        <footer className="border-t border-emerald-900/10 bg-white mt-8">
          <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-stone-500 flex flex-col sm:flex-row gap-1 sm:items-center sm:justify-between">
            <span><span className="font-bold text-emerald-800">✚ MediLifetime</span> • Every detail recordable • Every unknown stays unknown • Every change traceable</span>
            <span>No payments/billing in this system • All records stored in PostgreSQL with full audit trail.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
