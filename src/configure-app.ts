import { INestApplication } from '@nestjs/common';

export function configureApp(app: INestApplication): void {
  app.enableCors({ origin: true });
  const httpServer = app.getHttpAdapter().getInstance() as {
    set: (setting: string, value: number) => void;
  };
  httpServer.set('trust proxy', 1);
}
