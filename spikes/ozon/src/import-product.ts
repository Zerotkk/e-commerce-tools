import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sanitizeEvidence } from "./evidence.ts";
import { importSafely } from "./import-safely.ts";
import { OzonHttpClient } from "./ozon-http.ts";
import { OzonProductApi } from "./product-api.ts";

const clientId = process.env.OZON_CLIENT_ID;
const apiKey = process.env.OZON_API_KEY;
if (!clientId || !apiKey) {
  throw new Error("OZON_CLIENT_ID and OZON_API_KEY are required for controlled product validation");
}

const fixtureIndex = process.argv.indexOf("--fixture");
const fixturePath = fixtureIndex >= 0 ? process.argv[fixtureIndex + 1] : undefined;
if (!fixturePath) throw new Error("--fixture is required");

const item: Record<string, unknown> = JSON.parse(await readFile(resolve(fixturePath), "utf8"));
if (item.description_category_id === 0 || item.type_id === 0 || !Array.isArray(item.attributes) || item.attributes.length === 0) {
  throw new Error("FIXTURE_NOT_CONFIGURED: supply reviewed category, type, and required attributes before a live import");
}

const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const offerId = `E2E-OTTOMAN-${date}-01`;
item.offer_id = offerId;

const diagnostics: unknown[] = [];
const http = new OzonHttpClient({ clientId, apiKey, onDiagnostic: (record) => diagnostics.push(record) });
const productApi = new OzonProductApi(http);
const result = await importSafely(productApi, offerId, item);
const status = result.state === "submitted" ? await productApi.getImportStatus(result.taskId) : null;

const evidenceDirectory = resolve(import.meta.dirname, "../../../artifacts/spikes/ozon/redacted-responses");
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(resolve(evidenceDirectory, "import.json"), `${JSON.stringify(sanitizeEvidence({ offerId, result, diagnostics }), null, 2)}\n`, "utf8");
await writeFile(resolve(evidenceDirectory, "import-status.json"), `${JSON.stringify(sanitizeEvidence({ offerId, status, diagnostics }), null, 2)}\n`, "utf8");
await writeFile(
  resolve(evidenceDirectory, "product-info.json"),
  `${JSON.stringify(sanitizeEvidence({ offerId, product: await productApi.getByOfferId(offerId), diagnostics }), null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify({ offerId, result, status }, null, 2));
