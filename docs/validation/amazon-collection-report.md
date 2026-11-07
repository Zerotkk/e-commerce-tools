# Amazon current-variant collection report

Generated from the supplied workbook manifest. No credentials or cookies were used. Raw page content and raw snapshots, when available, are stored only under ignored `artifacts/private/amazon/`.

## Sample grouping and outcomes

| Sample | Group | Outcome | ASIN | Request duration (ms) | Evidence |
| --- | --- | --- | --- | ---: | --- |
| amazon-01 | development | failed | — | 2512 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-02 | development | failed | — | 2225 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-03 | development | failed | — | 1885 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-04 | development | failed | — | 1975 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-05 | regression | failed | — | 1706 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-06 | regression | failed | — | 2034 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-07 | regression | failed | — | 1647 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-08 | regression | failed | — | 1861 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-09 | regression | failed | — | 1508 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-10 | blind | excluded | — | 0 | CATEGORY_MISMATCH_PENDING_REVIEW |
| amazon-11 | blind | failed | — | 30797 | page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt |
| amazon-12 | blind | failed | — | 30869 | page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt |
| amazon-13 | blind | failed | — | 1828 | AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-14 | blind | failed | — | 1581 | AMAZON_CAPTCHA_INTERSTITIAL |

Excluded: DocSafe B0BLNJLY94 is recorded as `CATEGORY_MISMATCH_PENDING_REVIEW` and is not counted as a collection success.

## Blind field coverage

| Sample | Field | Extracted status | Visible-page review | Evidence |
| --- | --- | --- | --- | --- |
| amazon-11 | asin | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt |
| amazon-11 | color | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt |
| amazon-11 | size | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt |
| amazon-11 | first_product_image | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt |
| amazon-11 | product_dimensions | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt |
| amazon-11 | material | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt |
| amazon-11 | price | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt |
| amazon-12 | asin | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt |
| amazon-12 | color | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt |
| amazon-12 | size | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt |
| amazon-12 | first_product_image | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt |
| amazon-12 | product_dimensions | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt |
| amazon-12 | material | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt |
| amazon-12 | price | not_collected | uncertain | COLLECTION_BLOCKED:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt |
| amazon-13 | asin | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-13 | color | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-13 | size | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-13 | first_product_image | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-13 | product_dimensions | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-13 | material | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-13 | price | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-14 | asin | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-14 | color | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-14 | size | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-14 | first_product_image | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-14 | product_dimensions | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-14 | material | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |
| amazon-14 | price | not_collected | uncertain | COLLECTION_BLOCKED:AMAZON_CAPTCHA_INTERSTITIAL |

Anonymous Playwright batch successful fields: none.

## Authorized Chrome read-only evidence: amazon-01

This is a single manually inspected Chrome sample, separate from the anonymous Playwright batch and not a blind-sample acceptance result. The visible page URL and hidden page ASIN both identified `B092LVTSD4`; the visible current color was `Black`.

| Field | Status | Evidence |
| --- | --- | --- |
| ASIN | confirmed_source | URL and hidden page ASIN both `B092LVTSD4` |
| color | confirmed_source | Visible current selection: `Black` |
| brand | confirmed_source | Visible page brand: `Bsketa` |
| title | confirmed_source | Visible product title |
| price | confirmed_source | Visible price: `$24.99` |
| images | confirmed_source | One main product image and seven additional product images visible; not downloaded or reused |
| bullets | confirmed_source | Five visible product bullets |
| product_dimensions | conflict | Product overview: `43 × 12.99 × 12.99 in`; title and bullet: `17 × 13 × 13 in` |
| model | missing | No reliable visible model value |
| item_weight | missing | No reliable visible item-weight value |
| description | missing | No complete visible product-description field |
| selected_size | missing | No reliable current size-selection field |

This evidence does not change the blind-sample gate: the anonymous batch remains `not_accepted`.

## Authorized Chrome read-only evidence: workbook rows 2–4

These are separate, manual current-selection checks through the user-authorized Chrome extension. The input URL ASIN and a page-product ASIN were checked independently before recording any fact. No variant control was changed, no image was downloaded, and video thumbnails were excluded from the product-image lists.

### amazon-02 (workbook row 2)

- Input URL: `https://www.amazon.com/ALASDO-Storage-Ottoman-Footrest-13inches/dp/B08R93BQ3D/ref=`
- Canonical URL: `https://www.amazon.com/dp/B08R93BQ3D`
- URL ASIN and page ASIN: `B08R93BQ3D` / `B08R93BQ3D` (page product-overview module)

| Field | Status | Current-page evidence |
| --- | --- | --- |
| title | confirmed_source | `ALASDO Storage Ottoman Footrest Stool Small Ottoman with Storage Foldable Ottomans Foot Rest Footstool Bench for Living Room 17x13x13inches Grey` |
| brand | confirmed_source | Current-page byline: `Visit the ALASDO Store` |
| selected_color | confirmed_source | Current selection: `Grey` |
| selected_size | confirmed_source | Current selection: `13 in D x 17 in W x 13 in H` |
| price | confirmed_source | Visible price: `$26.99` |
| product_dimensions | uncertain | Current selection is `13 in D x 17 in W x 13 in H`; title and bullet use `17 x 13 x 13 in` with different dimension labels/order. No orientation was inferred. |
| item_weight | missing | No reliable current-page item-weight value. |
| main_image | confirmed_source | `https://m.media-amazon.com/images/I/81LqsWFH5bL._AC_SL1300_.jpg` |
| additional_product_images | confirmed_source | `https://m.media-amazon.com/images/I/416sh1RgMzL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/61QMLlULhoL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/51Et-D6amoL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/51SpJFKp6XL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/61RalM5npeL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/51lZQV4D4qL._AC_US100_.jpg` |
| bullets | confirmed_source | Five visible product bullets. |

### amazon-03 (workbook row 3)

- Input URL: `https://www.amazon.com/Sweetcrispy-Footstools-Anti-Slip-Adjustable-Footrest/dp/B0DC6NJ5P1/ref=`
- Canonical URL: `https://www.amazon.com/dp/B0DC6NJ5P1`
- URL ASIN and page ASIN: `B0DC6NJ5P1` / `B0DC6NJ5P1` (page product-overview module)

| Field | Status | Current-page evidence |
| --- | --- | --- |
| title | confirmed_source | `Sweetcrispy Vanity Stool Chair for Desk, Storage Faux Fur Ottoman, White` |
| brand | confirmed_source | Current-page byline: `Visit the Sweetcrispy Store` |
| selected_color | confirmed_source | Current selection: `White` |
| selected_size | missing | No current size-selection field was present. |
| price | uncertain | Raw current-page price text was `$2995`; no independently visible decimal component was available, so no currency amount was inferred. |
| product_dimensions | confirmed_source | Product overview and bullet: `12.2 in D x 16 in W x 18.9 in H` |
| item_weight | confirmed_source | Product overview: `8.9 pounds` |
| main_image | confirmed_source | `https://m.media-amazon.com/images/I/612gYVz2uFL._AC_SL1500_.jpg` |
| additional_product_images | confirmed_source | `https://m.media-amazon.com/images/I/41cV-qHn0iL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/51hC1O0id3L._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/41QdpEtQz0L._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/41Y0Xv34gYL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/41J+H0CncbL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/41uGEtSSMmL._AC_US100_.jpg` |
| bullets | confirmed_source | Six visible product bullets. |

### amazon-04 (workbook row 4)

- Input URL: `https://www.amazon.com/SONGMICS-Footrest-Capacity-Entryway-ULSF102G01/dp/B0BJDZFWFD/ref=`
- Canonical URL: `https://www.amazon.com/dp/B0BJDZFWFD`
- URL ASIN and page ASIN: `B0BJDZFWFD` / `B0BJDZFWFD` (page product-overview module)

| Field | Status | Current-page evidence |
| --- | --- | --- |
| title | confirmed_source | `SONGMICS Small Folding Storage Ottoman, 15.8 x 12.2 x 12.2 Inches` |
| brand | confirmed_source | Product overview: `Brand SONGMICS` |
| selected_color | confirmed_source | Current selection: `Dark Gray` |
| selected_size | confirmed_source | Current selection: `12.2 in D x 16.1 in W x 12.2 in H` |
| price | uncertain | Raw current-page price text was `$1879`; no independently visible decimal component was available, so no currency amount was inferred. |
| product_dimensions | conflict | Current selected size and product overview: `12.2 in D x 16.1 in W x 12.2 in H`; title: `15.8 x 12.2 x 12.2 Inches`. Both are on the same verified ASIN, so neither value was chosen. |
| item_weight | missing | No reliable current-page item-weight value. |
| main_image | confirmed_source | `https://m.media-amazon.com/images/I/91Y75RHHvGL._AC_SL1500_.jpg` |
| additional_product_images | confirmed_source | `https://m.media-amazon.com/images/I/41RjO56r9nL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/51dAzIJ3tPL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/41d+bZn2XUL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/41FMWmUEMzL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/51AOmo-HQxL._AC_US100_.jpg`, `https://m.media-amazon.com/images/I/41Le-o2egCL._AC_US100_.jpg` |
| bullets | confirmed_source | Five visible product bullets. |

### Current-page coverage summary

Across the 33 required row-2–4 field checks (ASIN, selected color, selected size, title, brand, price, dimensions, weight, main image, additional images, and bullets), 26 are `confirmed_source`, 3 are `missing`, 3 are `uncertain`, and 1 is `conflict`. Model and a complete product-description field were not reliably available for these records and remain uncollected. These three development-group checks do not repair or replace the existing blind group (`amazon-11`–`amazon-14`), whose gate remains `not_accepted`.

Missing or uncollected fields: amazon-11:asin, amazon-11:color, amazon-11:size, amazon-11:first_product_image, amazon-11:product_dimensions, amazon-11:material, amazon-11:price, amazon-12:asin, amazon-12:color, amazon-12:size, amazon-12:first_product_image, amazon-12:product_dimensions, amazon-12:material, amazon-12:price, amazon-13:asin, amazon-13:color, amazon-13:size, amazon-13:first_product_image, amazon-13:product_dimensions, amazon-13:material, amazon-13:price, amazon-14:asin, amazon-14:color, amazon-14:size, amazon-14:first_product_image, amazon-14:product_dimensions, amazon-14:material, amazon-14:price.

Anonymous-batch conflicting fields: none.

Blocking selector/acquisition failures: amazon-01:AMAZON_CAPTCHA_INTERSTITIAL, amazon-02:AMAZON_CAPTCHA_INTERSTITIAL, amazon-03:AMAZON_CAPTCHA_INTERSTITIAL, amazon-04:AMAZON_CAPTCHA_INTERSTITIAL, amazon-05:AMAZON_CAPTCHA_INTERSTITIAL, amazon-06:AMAZON_CAPTCHA_INTERSTITIAL, amazon-07:AMAZON_CAPTCHA_INTERSTITIAL, amazon-08:AMAZON_CAPTCHA_INTERSTITIAL, amazon-09:AMAZON_CAPTCHA_INTERSTITIAL, amazon-11:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt, amazon-12:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt, amazon-13:AMAZON_CAPTCHA_INTERSTITIAL, amazon-14:AMAZON_CAPTCHA_INTERSTITIAL.

## Delivery recovery record

- 2026-11-07 checkpoint: workbook rows 2–4 were verified through the authorized Chrome read-only session; the current-page evidence is recorded above. No CAPTCHA occurred and no variant option was changed.
- Verified: row-2 URL/page ASIN `B08R93BQ3D`, row-3 URL/page ASIN `B0DC6NJ5P1`, and row-4 URL/page ASIN `B0BJDZFWFD` matched. The row-4 dimensions remain `conflict`; this does not accept the anonymous blind gate.
- Unverified: the Amazon-spike test, lint, and typecheck suite did not start. `pnpm` stopped during its dependency preflight with `ERR_PNPM_IGNORED_BUILDS` for `esbuild@0.28.2` and `unrs-resolver@1.12.2`; no build-approval policy was changed.
- Next executable command after the dependency-build policy is resolved by its owner: `pnpm --filter @ecommerce/amazon-spike test`.
- Latest verified collection-evidence commit: `58bd3be` (`docs: record authorized Amazon sample evidence`).
- Verified: the authorized Chrome read-only `amazon-01` evidence above; Amazon-spike lint, typecheck, and tests completed before this delivery; the branch was pushed to `origin/agent/amazon-collection-spike` and Draft PR #2 was created against `main`.
- Not verified: the anonymous blind-sample fields remain uncollected, so the blind gate has not passed.
- Exact blocker: anonymous Playwright acquisition returned `AMAZON_CAPTCHA_INTERSTITIAL` for the listed samples and 30-second page-navigation timeouts for `amazon-11` and `amazon-12`.
- Next executable command, only after renewed collection authorization and a valid acquisition path: `pnpm --filter @ecommerce/amazon-spike collect -- --samples spikes/amazon/samples.json --delay-ms 5000`.
- Delivery blocker (2026-09-13): the single push attempt for the recovery record failed with `Failed to connect to github.com port 443 after 21189 ms: Could not connect to server`; local commit `d98ad53` is not on `origin`.
- Next delivery command, after GitHub connectivity is restored: `git push`.

## Decision gate

**not_accepted** — `BLIND_VISIBLE_PAGE_REVIEW_INCOMPLETE`. Acceptance requires completed visible-page comparison for every blind field and no known cross-variant contamination.

## Acquisition path

Selected validation path: canonical `https://www.amazon.com/dp/{ASIN}` loaded with Playwright without credentials or cookies; verify page ASIN; extract selected color, selected size, first product image, technical-details dimensions/material, and displayed price; save raw page/snapshot privately; normalize with provenance; publish only URL-free normalized output. This remains a spike path and is not approved for product implementation until the gate is accepted.
