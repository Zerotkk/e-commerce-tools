import { z } from "zod";

export const RawAmazonSnapshotSchema = z.object({
  asin: z.string().regex(/^[A-Z0-9]{10}$/),
  title: z.string().min(1),
  selectedColor: z.string().nullable(),
  selectedSize: z.string().nullable(),
  imageUrls: z.array(z.string().url()).min(1),
  bullets: z.array(z.string()),
  priceText: z.string().nullable(),
  detailRows: z.record(z.string(), z.string()),
  collectedAt: z.string().datetime(),
  sourceUrl: z.string().url(),
});

export type RawAmazonSnapshot = z.infer<typeof RawAmazonSnapshotSchema>;
