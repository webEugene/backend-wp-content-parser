import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { loggerConfig } from './core/logger.config';

const PORT = parseInt(process.env.PORT, 10) || 5000;
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: loggerConfig,
    rawBody: true,
  });
  app.setGlobalPrefix('api/v1/wp-parser');
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );
  await app.listen(PORT);
}
// https://dbdiagram.io/d/wp_parser-69ebe452ddb9320fdc472266
bootstrap();
