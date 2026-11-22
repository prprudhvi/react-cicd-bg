import { Module } from '@nestjs/common';
import { InfoResolver } from './info.resolver';
import { ServiceInfoService } from './service-info.service';
import { UsersService } from './users.service';

@Module({
  providers: [InfoResolver, ServiceInfoService, UsersService],
  exports: [ServiceInfoService],
})
export class InfoModule {}
