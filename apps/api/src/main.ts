import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { ApiModule } from "./api.module";

async function bootstrap() {
  const app = await NestFactory.create(ApiModule.register());
  app.setGlobalPrefix("api");

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
