export interface ContentFactDto {
  key: string;
  value: string | number | boolean;
  unit: string | null;
  sourceRef: string;
}

export interface ContentContextDto {
  asin: string;
  facts: ContentFactDto[];
}

export interface ImageCopyDto {
  heading: string;
  bullets: string[];
  factKeys: string[];
}

export interface GeneratedContentDto {
  titleRu: string;
  bulletsRu: string[];
  descriptionRu: string;
  keywordsRu: string[];
  imageCopy: ImageCopyDto[];
  usedFactKeys: string[];
}
