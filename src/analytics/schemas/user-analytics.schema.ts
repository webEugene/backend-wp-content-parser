import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserAnalytics extends Document {
  @Prop({ required: true, unique: true })
  clerkUserId: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true })
  signUpDate: Date;

  @Prop({ default: 'email' })
  signUpMethod: string; // 'email', 'google', 'github', etc.

  @Prop({ type: Object })
  metadata: Record<string, any>; // Additional user data
}

export const UserAnalyticsSchema = SchemaFactory.createForClass(UserAnalytics);
