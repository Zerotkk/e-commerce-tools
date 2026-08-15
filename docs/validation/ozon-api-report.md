# Ozon Seller API validation report

## Status

This spike has a tested local adapter and redaction path, but it is **not accepted as a live Ozon capability validation**. At the time of this report, `OZON_CLIENT_ID` and `OZON_API_KEY` were absent, so no Seller API request was sent and no category, attribute, import, status, invalid-field, duplicate, timeout, or rate-limit response was recorded.

## Implemented and locally verified

- `POST /v1/description-category/tree` client path and nested category/type search.
- `POST /v1/description-category/attribute` response mapping into `OzonAttributeDefinitionDto`.
- `POST /v3/product/import`, `POST /v1/product/import/info`, and `POST /v3/product/info/list` adapter paths.
- Asynchronous task ID extraction, field-error preservation, existing-offer prevention, and timeout outcome lookup.
- Diagnostic and evidence sanitisation: `Client-Id`, `Api-Key`, and `Authorization` key values are redacted recursively before persistence.

The local Ozon spike suite passed 9 tests and TypeScript type checking on 2026-08-15. This evidence does not establish live endpoint compatibility.

## Endpoint review

The current Seller API documentation family reviewed for this spike is:

| Capability | Candidate endpoint | Live status |
|---|---|---|
| Description category tree | `POST /v1/description-category/tree` | Not called |
| Required attributes | `POST /v1/description-category/attribute` | Not called |
| Attribute dictionary values | `POST /v1/description-category/attribute/values` | Not called |
| Product import | `POST /v3/product/import` | Not called |
| Import task status | `POST /v1/product/import/info` | Not called |
| Offer lookup | `POST /v3/product/info/list` | Not called |

These endpoint versions must be confirmed against the official Seller API documentation and the store's live responses before acceptance. No category/type IDs, required attributes, dictionary values, import task IDs, Ozon product IDs, SKUs, invalid-field messages, rate limits, or UTC request timestamps are reported because none were observed.

## Draft decision

**Ozon-side draft support is unverified.** The adapter exposes no draft-creation operation and the MVP must treat “Save draft” as an internal, approved `OzonDraft` until a credentialed live test proves an Ozon-side draft operation that does not start product creation or moderation. Only an explicit “Submit” action may call `OzonGateway.importProduct`.

## Required live-validation procedure

1. Set `OZON_CLIENT_ID` and `OZON_API_KEY` only in the invoking environment.
2. Run `pnpm --filter @ecommerce/ozon-spike category:find -- --query "пуф с ящиком для хранения"`, review the selected category/type, and populate the controlled fixture with its required attributes and public test image URL.
3. Run `pnpm --filter @ecommerce/ozon-spike product:import -- --fixture spikes/ozon/fixtures/minimal-product.json` once. It uses the deterministic current-date offer ID `E2E-OTTOMAN-YYYYMMDD-01`, records only sanitised evidence, and queries the offer before import.
4. Run the same import again to prove that the existing offer is not submitted twice.
5. Remove one required attribute only in memory, import once, and record the terminal field-level error.
6. Simulate or observe a timeout, query the offer before retrying, and record whether the outcome is confirmed or safely remains unknown.

Do not commit environment files, credentials, authentication headers, or raw responses. Add only the sanitised files produced in `artifacts/spikes/ozon/redacted-responses/` after review.
