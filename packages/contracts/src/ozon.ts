export interface OzonAttributeDefinitionDto {
  id: number;
  name: string;
  required: boolean;
  dictionaryId: number;
  collection: boolean;
  valueType: string;
}

export interface OzonFieldErrorDto {
  code: string;
  field: string;
  message: string;
  retryable: boolean;
}

export interface OzonImportRequestDto {
  offerId: string;
  name: string;
  descriptionCategoryId: number;
  typeId: number;
  price: string;
  inventory: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  weightGrams: number;
  imageUrls: string[];
  attributes: Array<{ id: number; values: Array<{ dictionaryValueId?: number; value?: string }> }>;
}

export type OzonImportStatusDto =
  | { state: "pending" }
  | { state: "succeeded"; productId: string; sku: string | null }
  | { state: "failed"; errors: OzonFieldErrorDto[] };
