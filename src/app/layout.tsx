import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCP Atlas Browser",
  description: "Browse persona data and MCP tool definitions",
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
                MA
              </div>
              <span className="font-semibold">MCP Atlas Browser</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/personas" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                Personas
              </Link>
              <Link href="/tools/shopping" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                Shopping
              </Link>
              <Link href="/tools/medical" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                Medical
              </Link>
              <Link href="/tools/professional" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                Professional
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
