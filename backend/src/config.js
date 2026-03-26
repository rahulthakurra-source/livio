import dotenv from "dotenv";

dotenv.config();

const DEFAULT_FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "null",
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendOrigins: [
    ...new Set(
      [
        ...(process.env.FRONTEND_ORIGIN || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        ...DEFAULT_FRONTEND_ORIGINS,
      ],
    ),
  ],
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
};
