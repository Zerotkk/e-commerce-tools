import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { SubjectExtractionResult, SubjectExtractor } from "./subject-extractor.js";

export interface ExtractionRunOptions {
  sourcePath: string;
  extractors: SubjectExtractor[];
}

export async function runExtraction({
  sourcePath,
  extractors,
}: ExtractionRunOptions): Promise<SubjectExtractionResult[]> {
  if (extractors.length < 2) {
    throw new Error(
      "At least two subject-extraction providers must be configured before an extraction comparison can run.",
    );
  }

  let source: Buffer;
  try {
    source = await readFile(sourcePath);
  } catch {
    throw new Error(`Authorized source image is unavailable: ${sourcePath}`);
  }

  return Promise.all(extractors.map((extractor) => extractor.extract(source)));
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const sourceFlag = args.indexOf("--source");
  const sourcePath = sourceFlag === -1 ? undefined : args[sourceFlag + 1];

  if (!sourcePath) {
    throw new Error("Missing --source <authorized-image-path>. No extraction was run.");
  }

  await runExtraction({ sourcePath, extractors: [] });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
