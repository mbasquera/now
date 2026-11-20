import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOW – esporte ao vivo na sua cidade",
  description: "Descubra jogos, lutas e campeonatos acontecendo agora ou hoje na sua cidade.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d10",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link href="/?trocar=1" className="flex items-center gap-2 text-xl font-black tracking-tight">
              <span className="live-dot inline-block h-2.5 w-2.5 rounded-full bg-live" />
              NOW
            </Link>
            <Link href="/painel" className="rounded-full border border-line px-3 py-1 text-xs">
              Sou organizador
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-16">{children}</main>
      </body>
    </html>
  );
}
