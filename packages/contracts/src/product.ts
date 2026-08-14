export type FactStatus = "confirmed_source" | "confirmed_manual" | "suggested" | "missing" | "conflict";

export type TaskStatus =
  | "pending_collection"
  | "collecting"
  | "pending_variant_confirmation"
  | "processing_content"
  | "generating_images"
  | "pending_review"
  | "pending_publish"
  | "publishing"
  | "published"
  | "publish_failed"
  | "abandoned";

export interface ProductFactDto {
  key: string;
  value: string | number | boolean | null;
  unit: string | null;
  status: FactStatus;
  sourceRef: string | null;
}

export interface VariantSnapshotDto {
  asin: string;
  color: string | null;
  size: string | null;
  imageUrls: string[];
  facts: ProductFactDto[];
}

export interface JobResult<T> {
  ok: boolean;
  value?: T;
  errorCode?: string;
  retryable?: boolean;
}

export const isPublishableFact = (fact: ProductFactDto): boolean =>
  fact.status === "confirmed_source" || fact.status === "confirmed_manual";
