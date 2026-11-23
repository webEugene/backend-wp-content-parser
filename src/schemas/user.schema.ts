import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserPlan } from '../common/enums/user-plan.enum';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: Number,
    enum: UserPlan,
    default: UserPlan.FREE,
  })
  plan_id: UserPlan;
}

export const UserSchema = SchemaFactory.createForClass(User);
