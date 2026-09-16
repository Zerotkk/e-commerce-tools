import type { OzonAttributeDefinitionDto } from "@ecommerce/contracts";

interface DescriptionCategoryAttributeResponse {
  result: Array<{
    id: number;
    name: string;
    is_required: boolean;
    dictionary_id: number;
    is_collection: boolean;
    type: string;
  }>;
}

export interface DescriptionCategoryNode {
  description_category_id?: number;
  category_name?: string;
  type_id?: number;
  type_name?: string;
  disabled: boolean;
  children: DescriptionCategoryNode[];
}

export interface DescriptionCategoryTreeResponse {
  result: DescriptionCategoryNode[];
}

export interface DescriptionCategoryMatch {
  descriptionCategoryId: number;
  categoryName: string;
  typeId: number;
  typeName: string;
}

export function mapAttributeDefinitions(input: DescriptionCategoryAttributeResponse): OzonAttributeDefinitionDto[] {
  return input.result.map((item) => ({
    id: item.id,
    name: item.name,
    required: item.is_required,
    dictionaryId: item.dictionary_id,
    collection: item.is_collection,
    valueType: item.type,
  }));
}

export function selectDictionaryAttributes(attributes: OzonAttributeDefinitionDto[]): OzonAttributeDefinitionDto[] {
  return attributes.filter((attribute) => attribute.dictionaryId > 0);
}

export function findDescriptionCategoryMatches(
  input: DescriptionCategoryTreeResponse,
  query: string,
): DescriptionCategoryMatch[] {
  const queryTokens = normalize(query);
  const matches: DescriptionCategoryMatch[] = [];

  const visit = (node: DescriptionCategoryNode): void => {
    if (node.disabled) return;

    if (node.description_category_id !== undefined && node.category_name && matchesQuery(node.category_name, queryTokens)) {
      for (const child of node.children) {
        if (child.disabled || child.type_id === undefined || !child.type_name) continue;
        matches.push({
          descriptionCategoryId: node.description_category_id,
          categoryName: node.category_name,
          typeId: child.type_id,
          typeName: child.type_name,
        });
      }
    }

    for (const child of node.children) visit(child);
  };

  for (const node of input.result) visit(node);
  return matches;
}

function normalize(value: string): string[] {
  return value.toLocaleLowerCase("ru-RU").replaceAll("ё", "е").match(/[\p{L}\p{N}]+/gu) ?? [];
}

function matchesQuery(categoryName: string, queryTokens: string[]): boolean {
  const categoryTokens = normalize(categoryName);
  return queryTokens.every((queryToken) =>
    categoryTokens.some((categoryToken) => categoryToken.startsWith(queryToken) || queryToken.startsWith(categoryToken)),
  );
}
