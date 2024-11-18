import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Analytics {
  @Prop({ required: true, unique: true })
  hostname: string;

  @Prop({ required: true })
  tries: number;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
