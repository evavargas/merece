import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8),
  SESSION_SECRET: z.string().min(32),
  // Opcionales: si faltan, el API simplemente no avisa a la web (en local, por ejemplo).
  WEB_URL: z.url().optional(),
  REVALIDATE_SECRET: z.string().min(16).optional(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default("development"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;
// Lazy para que los tests puedan inyectar env antes del primer uso.
export const env = (): Env => (cached ??= schema.parse(process.env));
