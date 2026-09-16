import type { OzonAttributeDefinitionDto, OzonImportRequestDto, OzonImportStatusDto } from "@ecommerce/contracts";

export interface OzonGateway {
  getRequiredAttributes(descriptionCategoryId: number, typeId: number): Promise<OzonAttributeDefinitionDto[]>;
  findByOfferId(offerId: string): Promise<{ productId: string; sku: string | null } | null>;
  importProduct(request: OzonImportRequestDto): Promise<{ taskId: number }>;
  getImportStatus(taskId: number): Promise<OzonImportStatusDto>;
}
