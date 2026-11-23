import { NextFunction, Request, Response } from 'express';

declare function metricsMiddleware(req: Request, res: Response, next: NextFunction): void;

export default metricsMiddleware;
