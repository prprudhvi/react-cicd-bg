import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { HealthController } from './health/health.controller';
import { InfoModule } from './info/info.module';
import { MetricsController } from './monitoring/metrics.controller';
import { metricsMiddleware } from './monitoring/metricsMiddleware';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
    }),
    InfoModule,
  ],
  controllers: [HealthController, MetricsController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(metricsMiddleware, RequestLoggerMiddleware).forRoutes('{*splat}');
  }
}
