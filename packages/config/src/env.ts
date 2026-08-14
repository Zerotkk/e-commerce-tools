import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  APP_ENCRYPTION_KEY_BASE64: z.string().refine((value) => Buffer.from(value, "base64").length === 32),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("ecommerce-assets"),
  S3_ACCESS_KEY: z.string().min(1).default("ecommerce"),
  S3_SECRET_KEY: z.string().min(8),
});

export type AppEnv = z.infer<typeof schema>;

export const loadAppEnv = (input: NodeJS.ProcessEnv): AppEnv => schema.parse(input);
