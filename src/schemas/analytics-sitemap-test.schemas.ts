import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class AnalyticsSitemapTest {
  @Prop({ required: true })
  website: string;

  @Prop({ required: true })
  tries: number;

  @Prop({ required: true })
  host: string;

  @Prop({ required: true })
  status: boolean;
}

export const AnalyticsSitemapTestSchema = SchemaFactory.createForClass(
  AnalyticsSitemapTest,
);
