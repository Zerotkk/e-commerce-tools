export interface SubjectExtractionResult {
  png: Buffer;
  confidence: number | null;
  provider: string;
  durationMs: number;
  costUsd: number | null;
}

export interface SubjectExtractor {
  extract(source: Buffer): Promise<SubjectExtractionResult>;
}

export interface ExtractionMetrics {
  alphaTouchesTop: boolean;
  alphaTouchesRight: boolean;
  alphaTouchesBottom: boolean;
  alphaTouchesLeft: boolean;
  opaqueRatio: number;
}

export function validateExtraction(metrics: ExtractionMetrics) {
  if (
    metrics.alphaTouchesTop ||
    metrics.alphaTouchesRight ||
    metrics.alphaTouchesBottom ||
    metrics.alphaTouchesLeft
  ) {
    return { accepted: false as const, reason: "SUBJECT_TOUCHES_EDGE" };
  }

  if (metrics.opaqueRatio < 0.05 || metrics.opaqueRatio > 0.95) {
    return { accepted: false as const, reason: "INVALID_ALPHA_RATIO" };
  }

  return { accepted: true as const };
}
