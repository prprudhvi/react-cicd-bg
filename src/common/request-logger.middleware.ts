import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { readClientIp, readOperation, recordCall } from './call-log';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const started = Date.now();
    const method = req.method;
    const path = req.originalUrl || req.url;
    const ip = readClientIp(req);
    const operation = readOperation(req.body);

    recordCall({ method, path, ip, operation });
    this.logger.log(
      `call received ${method} ${path} ip=${ip}${operation ? ` operation=${operation}` : ''}`,
    );

    res.on('finish', () => {
      this.logger.log(
        `call completed ${method} ${path} status=${res.statusCode} durationMs=${Date.now() - started} ip=${ip}`,
      );
    });

    next();
  }
}
