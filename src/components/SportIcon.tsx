/** Ícones próprios dos esportes (traço, herdam a cor do texto). */
export function SportIcon({ slug, className = "h-5 w-5" }: { slug: string; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (slug) {
    case "futebol":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.2" />
          <path d="M12 7.6l3.3 2.4-1.3 3.9H10l-1.3-3.9z" fill="currentColor" stroke="none" />
          <path d="M12 7.6V2.9M15.3 10l4.4-1.5M14 13.9l2.7 3.8M10 13.9l-2.7 3.8M8.7 10L4.3 8.5" />
        </svg>
      );
    case "futsal":
      return (
        <svg {...common}>
          <path d="M3 20V7h18v13" />
          <path d="M3 11h4M21 11h-4M7 7v4M17 7v4" strokeWidth={1.2} />
          <circle cx="12" cy="15.5" r="3.6" />
          <path d="M12 13.4l1.6 1.2-.6 1.9h-2l-.6-1.9z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "basquete":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.2" />
          <path d="M2.8 12h18.4M12 2.8v18.4" />
          <path d="M5.4 5.4c2.6 2.4 3.6 4.4 3.6 6.6s-1 4.2-3.6 6.6M18.6 5.4C16 7.8 15 9.8 15 12s1 4.2 3.6 6.6" />
        </svg>
      );
    case "volei":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.2" />
          <path d="M12 12c0-4 1.6-7 4.6-8.4M12 12c-3.5 2-6.9 2.1-9.1.5M12 12c3.4 2 5.2 5 5 8.3" />
          <path d="M8.2 3.7c3 1.5 4.6 4.6 3.8 8.3M20.8 13.4c-2.6 1.6-5.9 1.4-8.8-1.4M6.5 19.4c.4-3 2.4-5.6 5.5-7.4" />
        </svg>
      );
    case "jiu-jitsu":
      return (
        <svg {...common}>
          <path d="M2.5 9.5h19v4h-19z" />
          <path d="M10 9l2 2.5 2-2.5" />
          <path d="M10.6 12.5L7.5 21M13.4 12.5L16.5 21" />
          <path d="M8.6 18.2l2.2.8M15.4 18.2l-2.2.8" strokeWidth={1.2} />
        </svg>
      );
    case "mma":
      return (
        <svg {...common}>
          <path d="M7 10.5V7.2A3.7 3.7 0 0 1 10.7 3.5h3.6A3.7 3.7 0 0 1 18 7.2v6.3a4.5 4.5 0 0 1-4.5 4.5H11A4 4 0 0 1 7 14z" />
          <path d="M7 10.5h-.6A2.4 2.4 0 0 0 4 12.9v0a2.4 2.4 0 0 0 2.4 2.4H7" />
          <path d="M10 9.5h5M8.5 18v2.5h7.5V18" />
        </svg>
      );
    case "handebol":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.2" />
          <path d="M12 2.8c-2.4 2.6-3.6 5.7-3.6 9.2s1.2 6.6 3.6 9.2M12 2.8c2.4 2.6 3.6 5.7 3.6 9.2s-1.2 6.6-3.6 9.2M3.6 8.5h16.8M3.6 15.5h16.8" />
        </svg>
      );
    case "rugby":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-35 12 12)" />
          <path d="M9.5 14.5l5-5M10.5 11.5l2 2M12 10l2 2" />
        </svg>
      );
    case "corrida":
      return (
        <svg {...common}>
          <circle cx="14.5" cy="4.5" r="1.8" />
          <path d="M9 21l2.5-5.5L14 17v4M11.5 15.5l1.5-5.5-3 1.5-2 3M13 10l2.5 3 3 .5" />
        </svg>
      );
    case "ciclismo":
      return (
        <svg {...common}>
          <circle cx="5.5" cy="16.5" r="3.8" />
          <circle cx="18.5" cy="16.5" r="3.8" />
          <path d="M5.5 16.5l4-7h6l3 7M9.5 9.5L12 16.5h3.5M14 6.5h2.5" />
        </svg>
      );
    case "triatlo":
      return (
        <svg {...common}>
          <path d="M2.5 17c1.6 1.2 3.2 1.2 4.8 0s3.2-1.2 4.8 0 3.2 1.2 4.8 0 3.2-1.2 4.6 0" />
          <circle cx="15.5" cy="6" r="1.8" />
          <path d="M5 13.5l4.5-4 3 2 3.5-2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
          <path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4" />
        </svg>
      );
  }
}
