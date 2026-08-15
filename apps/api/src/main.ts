import { NestFactory } from "@nestjs/core";
import { pathToFileURL } from "node:url";
import { AppModule } from "./app.module.js";

export const buildApp = () => NestFactory.create(AppModule, { logger: false });

const entrypoint = process.argv[1];

if (entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href) {
  const app = await buildApp();
  await app.listen(process.env.PORT ?? 3001);
}
