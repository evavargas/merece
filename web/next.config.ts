import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const config: NextConfig = {
  // El navegador habla siempre con el mismo origen: la cookie de sesión no necesita CORS.
  rewrites: async () => [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default config;
