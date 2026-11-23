import { Module } from '@nestjs/common';
import { AnalyzerController } from './analyzer.controller';
import { AnalyzerService } from './analyzer.service';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [ParserModule],
  controllers: [AnalyzerController],
  providers: [AnalyzerService],
})
export class AnalyzerModule {}
