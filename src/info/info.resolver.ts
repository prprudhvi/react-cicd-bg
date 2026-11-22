import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { listCalls } from '../common/call-log';
import { CallLog } from './models/call-log.model';
import { ServiceInfo } from './models/service-info.model';
import { User } from './models/user.model';
import { ServiceInfoService } from './service-info.service';
import { UsersService } from './users.service';

@Resolver()
export class InfoResolver {
  constructor(
    private readonly serviceInfo: ServiceInfoService,
    private readonly usersService: UsersService,
  ) {}

  @Query(() => ServiceInfo, { description: 'IP address and host of this service.' })
  service(): ServiceInfo {
    return this.serviceInfo.getServiceInfo();
  }

  @Query(() => [User], { description: 'Temporary demo users.' })
  users(): User[] {
    return this.usersService.findAll();
  }

  @Query(() => User, { nullable: true, description: 'One temporary user by id.' })
  user(@Args('id', { type: () => ID }) id: string): User | null {
    return this.usersService.findOne(id);
  }

  @Query(() => [CallLog], { description: 'Recent calls this process has logged.' })
  calls(): CallLog[] {
    return listCalls();
  }
}
