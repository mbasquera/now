import type { SportEvent } from "./types";

/** Nome do local quando a fonte não informa o ginásio (a página do evento não mostra "Como chegar"). */
export const UNKNOWN_VENUE = "Local a confirmar";

/** "https://www.instagram.com/copasp/" -> "instagram.com" */
export function sourceDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Texto curto da fonte para o card. */
export function sourceLabel(event: Pick<SportEvent, "source" | "sourceUrl">): string | null {
  if (event.source === "api-sports") return "API-Sports (dados da competição)";
  return sourceDomain(event.sourceUrl);
}
