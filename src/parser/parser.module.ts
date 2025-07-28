import { forwardRef, Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { HttpModule } from '@nestjs/axios';
import { UrlsModule } from '../urls/urls.module';

@Module({
  controllers: [ParserController],
  providers: [ParserService],
  exports: [ParserService],
  imports: [HttpModule, forwardRef(() => UrlsModule)],
})
export class ParserModule {}
