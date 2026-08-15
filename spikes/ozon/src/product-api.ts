import type { OzonHttpClient } from "./ozon-http.js";
import type { OzonImportStatusDto } from "@ecommerce/contracts";

export const parseImportResponse = (input: { result: { task_id: number } }) => ({ taskId: input.result.task_id });

export interface OzonOfferLookupResponse {
  result?: { items?: unknown[] };
}

export function parseImportStatus(input: {
  result: {
    items: Array<{
      status: string;
      product_id?: string | number;
      sku?: string | number | null;
      errors?: Array<{ code?: string; field?: string; message?: string }>;
    }>;
  };
}): OzonImportStatusDto {
  const item = input.result.items[0];
  if (!item) return { state: "pending" };

  const errors = item.errors ?? [];
  if (errors.length > 0) {
    return {
      state: "failed",
      errors: errors.map((error) => ({
        code: error.code ?? "OZON_VALIDATION_ERROR",
        field: error.field ?? "unknown",
        message: error.message ?? "Ozon rejected the product import",
        retryable: false,
      })),
    };
  }

  if (item.status.toLowerCase() === "imported" && item.product_id !== undefined) {
    return { state: "succeeded", productId: String(item.product_id), sku: item.sku === null ? null : String(item.sku ?? "") || null };
  }

  return { state: "pending" };
}

export class OzonProductApi {
  constructor(private readonly http: OzonHttpClient) {}

  async importProduct(item: unknown): Promise<{ taskId: number }> {
    return parseImportResponse(await this.http.post<{ result: { task_id: number } }>("/v3/product/import", { items: [item] }));
  }

  async getImportStatus(taskId: number): Promise<OzonImportStatusDto> {
    const response = await this.http.post<Parameters<typeof parseImportStatus>[0]>("/v1/product/import/info", { task_id: taskId });
    return parseImportStatus(response);
  }

  async getByOfferId(offerId: string): Promise<OzonOfferLookupResponse> {
    return this.http.post<OzonOfferLookupResponse>("/v3/product/info/list", { offer_id: [offerId], product_id: [], sku: [] });
  }
}
