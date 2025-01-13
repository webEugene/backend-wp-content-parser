import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class User {
  @Prop()
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: ['user'] }) // Default role is 'user'
  roles: string[];

  @Prop()
  plan_id?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
