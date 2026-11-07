import type { ProductFactDto, VariantSnapshotDto } from "@ecommerce/contracts";
import type { RawAmazonSnapshot } from "./raw-snapshot.js";

function normalizedValues(values: Array<string | null | undefined>): string[] {
  return [
    ...new Map(
      values
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => [value.trim().toLowerCase(), value.trim()]),
    ).values(),
  ];
}

function fact(
  asin: string,
  key: string,
  values: Array<string | null | undefined>,
  unit: string | null = null,
): ProductFactDto {
  const unique = normalizedValues(values);

  if (unique.length === 0) return { key, value: null, unit, status: "missing", sourceRef: null };
  if (unique.length > 1) return { key, value: null, unit, status: "conflict", sourceRef: `amazon:${asin}:${key}` };

  return { key, value: unique[0]!, unit, status: "confirmed_source", sourceRef: `amazon:${asin}:${key}` };
}

const row = (raw: RawAmazonSnapshot, ...labels: string[]) => {
  const wanted = new Set(labels.map((label) => label.toLowerCase()));
  return Object.entries(raw.detailRows)
    .filter(([label]) => wanted.has(label.trim().toLowerCase()))
    .map(([, value]) => value);
};

export function normalizeSnapshot(raw: RawAmazonSnapshot): VariantSnapshotDto {
  const facts: ProductFactDto[] = [
    fact(raw.asin, "title", [raw.title]),
    fact(raw.asin, "brand", row(raw, "Brand")),
    fact(raw.asin, "model", row(raw, "Item model number", "Model Name")),
    fact(raw.asin, "color", [raw.selectedColor, ...row(raw, "Color")]),
    fact(raw.asin, "size", [raw.selectedSize]),
    fact(raw.asin, "product_dimensions", [...row(raw, "Product Dimensions"), ...row(raw, "Size")]),
    fact(raw.asin, "item_weight", row(raw, "Item Weight")),
    fact(raw.asin, "material", row(raw, "Material")),
    fact(raw.asin, "load_capacity", row(raw, "Maximum Weight Recommendation", "Load Capacity")),
    fact(raw.asin, "storage_capacity", row(raw, "Capacity")),
    fact(raw.asin, "source_price", [raw.priceText], "USD"),
  ];

  return { asin: raw.asin, color: raw.selectedColor, size: raw.selectedSize, imageUrls: raw.imageUrls, facts };
}
