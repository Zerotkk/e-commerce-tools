import { NestFactory } from "@nestjs/core";
import { pathToFileURL } from "node:url";
import { AppModule } from "./app.module.js";

export const bootstrapWorker = () => NestFactory.createApplicationContext(AppModule, { logger: false });

const entrypoint = process.argv[1];

if (entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href) {
  await bootstrapWorker();
}
