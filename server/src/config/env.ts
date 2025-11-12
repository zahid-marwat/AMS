import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import path from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'),      // server/.env
  path.resolve(__dirname, '../../../.env'),   // repo root .env (if present)
];

let envLoaded = false;

for (const envPath of candidateEnvPaths) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
    envLoaded = true;
  }
}

if (!envLoaded) {
  // Fall back to default lookup (useful for environments that inject variables directly).
  loadEnv();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(30),
  JWT_REFRESH_SECRET: z.string().min(30),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
export const config = env;
