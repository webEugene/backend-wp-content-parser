import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [ParserController],
  providers: [ParserService],
  imports: [HttpModule],
})
export class ParserModule {}
