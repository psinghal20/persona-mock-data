import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Persona Visualiser - Shopping Test Data",
  description: "Browse persona shopping data for MCP Atlas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <header className="border-b border-[var(--border)] sticky top-0 bg-[var(--background)] z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                PV
              </div>
              <div>
                <span className="font-semibold">Persona Visualiser</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]">
                  SHOPPING TEST DATA
                </span>
              </div>
            </Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
