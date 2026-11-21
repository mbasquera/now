import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-condensed",
});

export const metadata: Metadata = {
  title: "NOW – esporte ao vivo na sua cidade",
  description: "Descubra jogos, lutas e campeonatos acontecendo agora ou hoje na sua cidade.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07111f",
};

function Logo() {
  return (
    <span className="flex items-center gap-1.5 font-display text-2xl leading-none font-extrabold italic tracking-tight">
      <span className="relative flex h-3 w-3 items-center justify-center">
        <span className="live-dot absolute h-3 w-3 rounded-full bg-live/40" />
        <span className="h-2 w-2 rounded-full bg-live" />
      </span>
      NOW
    </span>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${condensed.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
            <Link href="/?trocar=1" aria-label="NOW, página inicial">
              <Logo />
            </Link>
            <Link
              href="/painel"
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-white/90 hover:border-accent hover:text-accent"
            >
              Divulgar evento
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">{children}</main>
        <footer className="border-t border-line/70">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-muted">
            <p>
              Dados de jogos e escudos: API-Sports e agendas oficiais das competições. Cada evento traz o link da
              fonte.
            </p>
            <p className="mt-1">
              Fotos de capa:{" "}
              <a href="https://unsplash.com/?utm_source=now&utm_medium=referral" className="underline hover:text-white">
                Unsplash
              </a>{" "}
              (créditos na página de cada evento).
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
