import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Temporary demo user stored in this service.' })
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  role: string;

  @Field()
  city: string;

  @Field({ description: 'True when this record is temporary demo data.' })
  temporary: boolean;
}
