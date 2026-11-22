import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Network identity of this NestJS service.' })
export class ServiceInfo {
  @Field()
  name: string;

  @Field({ description: 'Address clients should use for this service.' })
  ip: string;

  @Field(() => [String])
  addresses: string[];

  @Field()
  hostname: string;

  @Field(() => Int)
  port: number;
}
