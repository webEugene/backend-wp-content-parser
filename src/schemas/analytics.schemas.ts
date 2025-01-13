import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Analytics {
  @Prop({ required: true })
  website: string;

  @Prop({ required: true })
  tries: number;

  @Prop({ required: true })
  host: string;

  @Prop({ required: true })
  wpDetect: boolean;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
