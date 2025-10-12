import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false
    })
  );
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(8080);
}

void bootstrap();
