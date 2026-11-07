import type { JobResult, VariantSnapshotDto } from "@ecommerce/contracts";

export interface AmazonCollector {
  collect(url: string): Promise<JobResult<VariantSnapshotDto>>;
}
