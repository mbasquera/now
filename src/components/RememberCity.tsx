"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Lembra a última cidade visitada e atualiza a lista a cada minuto. */
export function RememberCity({ slug }: { slug: string }) {
  const router = useRouter();
  useEffect(() => {
    document.cookie = `now_city=${slug}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const t = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(t);
  }, [slug, router]);
  return null;
}
