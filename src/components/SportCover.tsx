import { SPORT_PHOTOS, getSport, photoUrl } from "@/lib/sports";
import { SportIcon } from "./SportIcon";

/**
 * Capa de um evento: a foto do próprio evento, senão a foto do esporte. Por baixo fica sempre uma
 * ilustração com a cor e o ícone do esporte, que aparece se a foto não carregar.
 */
export function SportCover({
  sportSlug,
  imageUrl,
  width = 800,
  className = "",
  priority = false,
}: {
  sportSlug: string;
  imageUrl?: string | null;
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  const sport = getSport(sportSlug);
  const photo = SPORT_PHOTOS[sportSlug];
  const src = imageUrl || (photo ? photoUrl(photo, width) : null);
  return (
    <div className={`overflow-hidden bg-raised ${className.includes("absolute") ? "" : "relative"} ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 85% 10%, ${sport.color}55, transparent 60%), linear-gradient(160deg, #13243c, #091424)`,
        }}
      />
      <span className="absolute -right-6 -bottom-8 opacity-25" style={{ color: sport.color }}>
        <SportIcon slug={sportSlug} className="h-44 w-44" />
      </span>
      {/* imagem de fundo: se não carregar, não aparece ícone de imagem quebrada, só a ilustração */}
      {src && (
        <div
          role="presentation"
          data-priority={priority || undefined}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${src}")` }}
        />
      )}
    </div>
  );
}
