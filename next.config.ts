import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite enviar fotos de até 5 MB pelo formulário de evento.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
