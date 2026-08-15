import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  findDescriptionCategoryMatches,
  mapAttributeDefinitions,
  type DescriptionCategoryTreeResponse,
} from "./category-api.ts";
import { sanitizeEvidence } from "./evidence.ts";
import { OzonHttpClient } from "./ozon-http.ts";

const clientId = process.env.OZON_CLIENT_ID;
const apiKey = process.env.OZON_API_KEY;

if (!clientId || !apiKey) {
  throw new Error("OZON_CLIENT_ID and OZON_API_KEY are required for live category validation");
}

const queryIndex = process.argv.indexOf("--query");
const query = queryIndex >= 0 ? process.argv[queryIndex + 1] : undefined;

if (!query) {
  throw new Error("--query is required");
}

const diagnostics: unknown[] = [];
const http = new OzonHttpClient({ clientId, apiKey, onDiagnostic: (record) => diagnostics.push(record) });
const tree = await http.post<DescriptionCategoryTreeResponse>("/v1/description-category/tree", { language: "RU" });
const matches = findDescriptionCategoryMatches(tree, query);

const evidenceDirectory = resolve(import.meta.dirname, "../../../artifacts/spikes/ozon/redacted-responses");
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(
  resolve(evidenceDirectory, "category-tree.json"),
  `${JSON.stringify(sanitizeEvidence({ query, matches, diagnostics }), null, 2)}\n`,
  "utf8",
);

if (matches.length !== 1) {
  console.log(JSON.stringify({ query, matches }, null, 2));
  throw new Error("CATEGORY_SELECTION_REQUIRED");
}

const selected = matches[0];
if (!selected) {
  throw new Error("CATEGORY_SELECTION_REQUIRED");
}
const attributes = await http.post<{
  result: Array<{
    id: number;
    name: string;
    is_required: boolean;
    dictionary_id: number;
    is_collection: boolean;
    type: string;
  }>;
}>("/v1/description-category/attribute", {
  description_category_id: selected.descriptionCategoryId,
  type_id: selected.typeId,
  language: "RU",
});

await writeFile(
  resolve(evidenceDirectory, "category-attributes.json"),
  `${JSON.stringify(sanitizeEvidence({ selected, attributes: mapAttributeDefinitions(attributes), diagnostics }), null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify({ selected, attributes: mapAttributeDefinitions(attributes) }, null, 2));
