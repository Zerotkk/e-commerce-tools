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

Successful fields: none.

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

Missing or uncollected fields: amazon-11:asin, amazon-11:color, amazon-11:size, amazon-11:first_product_image, amazon-11:product_dimensions, amazon-11:material, amazon-11:price, amazon-12:asin, amazon-12:color, amazon-12:size, amazon-12:first_product_image, amazon-12:product_dimensions, amazon-12:material, amazon-12:price, amazon-13:asin, amazon-13:color, amazon-13:size, amazon-13:first_product_image, amazon-13:product_dimensions, amazon-13:material, amazon-13:price, amazon-14:asin, amazon-14:color, amazon-14:size, amazon-14:first_product_image, amazon-14:product_dimensions, amazon-14:material, amazon-14:price.

Conflicting fields: none.

Blocking selector/acquisition failures: amazon-01:AMAZON_CAPTCHA_INTERSTITIAL, amazon-02:AMAZON_CAPTCHA_INTERSTITIAL, amazon-03:AMAZON_CAPTCHA_INTERSTITIAL, amazon-04:AMAZON_CAPTCHA_INTERSTITIAL, amazon-05:AMAZON_CAPTCHA_INTERSTITIAL, amazon-06:AMAZON_CAPTCHA_INTERSTITIAL, amazon-07:AMAZON_CAPTCHA_INTERSTITIAL, amazon-08:AMAZON_CAPTCHA_INTERSTITIAL, amazon-09:AMAZON_CAPTCHA_INTERSTITIAL, amazon-11:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0DXF1K79Z___waiting_unt, amazon-12:page_goto__Timeout_30000ms_exceeded__Call_log____2m____navigating_to__https___www_amazon_com_dp_B0FXWZDK62___waiting_unt, amazon-13:AMAZON_CAPTCHA_INTERSTITIAL, amazon-14:AMAZON_CAPTCHA_INTERSTITIAL.

## Decision gate

**not_accepted** — `BLIND_VISIBLE_PAGE_REVIEW_INCOMPLETE`. Acceptance requires completed visible-page comparison for every blind field and no known cross-variant contamination.

## Acquisition path

Selected validation path: canonical `https://www.amazon.com/dp/{ASIN}` loaded with Playwright without credentials or cookies; verify page ASIN; extract selected color, selected size, first product image, technical-details dimensions/material, and displayed price; save raw page/snapshot privately; normalize with provenance; publish only URL-free normalized output. This remains a spike path and is not approved for product implementation until the gate is accepted.
