import { Module } from '@nestjs/common';
import { ParseDbService } from './parse-db.service';

@Module({
  providers: [ParseDbService],
})
export class ParseDbModule {}
