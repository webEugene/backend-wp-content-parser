import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Report {
  @Prop({ required: true })
  pageName: string;

  @Prop({ default: null })
  email: string;

  @Prop({ required: true })
  report: string;

  @Prop({ required: true, default: 0 })
  status: number;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
