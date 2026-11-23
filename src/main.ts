import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const port = Number(process.env.PORT ?? 4001);
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`Health ready at http://localhost:${port}/health`);
  logger.log(`Metrics ready at http://localhost:${port}/metrics`);
  logger.log(`GraphQL ready at http://localhost:${port}/graphql`);
}

void bootstrap();
