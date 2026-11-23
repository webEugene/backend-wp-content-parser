import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LoginEvent extends Document {
  @Prop({ required: true })
  clerkUserId: string;

  @Prop({ required: true })
  sessionId: string;

  @Prop({ required: true })
  loginAt: Date;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;
}

export const LoginEventSchema = SchemaFactory.createForClass(LoginEvent);

// Create index for faster queries
LoginEventSchema.index({ clerkUserId: 1, loginAt: -1 });
