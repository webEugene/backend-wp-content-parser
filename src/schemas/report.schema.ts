import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Report {
  @Prop({ required: true })
  pageName: string;

  @Prop({ default: null })
  email: string;

  @Prop({ required: true })
  report: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
