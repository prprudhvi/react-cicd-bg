import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'A call this service has received.' })
export class CallLog {
  @Field(() => ID)
  id: string;

  @Field()
  method: string;

  @Field()
  path: string;

  @Field()
  ip: string;

  @Field(() => String, { nullable: true })
  operation: string | null;

  @Field()
  receivedAt: string;
}
