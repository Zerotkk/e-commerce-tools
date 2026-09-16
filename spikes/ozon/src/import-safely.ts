import type { OzonOfferLookupResponse } from "./product-api.js";

interface ImportApi {
  importProduct(item: unknown): Promise<{ taskId: number }>;
  getByOfferId(offerId: string): Promise<OzonOfferLookupResponse>;
}

export async function importSafely(api: ImportApi, offerId: string, item: unknown) {
  const existing = await api.getByOfferId(offerId);
  if (hasOffer(existing)) return { state: "already_exists" as const };

  try {
    const submission = await api.importProduct(item);
    return { state: "submitted" as const, taskId: submission.taskId };
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "AbortError") throw error;

    const afterTimeout = await api.getByOfferId(offerId);
    return hasOffer(afterTimeout)
      ? { state: "confirmed_after_timeout" as const }
      : { state: "unknown_after_timeout" as const };
  }
}

function hasOffer(response: OzonOfferLookupResponse): boolean {
  return (response.result?.items?.length ?? 0) > 0;
}
