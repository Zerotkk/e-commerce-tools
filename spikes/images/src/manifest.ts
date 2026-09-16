import { createHash } from "node:crypto";
import { z } from "zod";

export const ImageSampleSchema = z.object({
  sampleId: z.string().min(1),
  sourcePath: z.string().min(1),
  asin: z.string().regex(/^[A-Z0-9]{10}$/),
  color: z.string().min(1),
  size: z.string().min(1),
  facts: z.record(z.string(), z.string()),
});

export type ImageSample = z.infer<typeof ImageSampleSchema>;

export const parseImageSamples = (input: unknown): ImageSample[] => z.array(ImageSampleSchema).parse(input);

export const sha256 = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");
