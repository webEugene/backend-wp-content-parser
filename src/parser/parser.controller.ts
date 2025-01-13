import { Body, Controller, Post } from '@nestjs/common';
import { ParserService } from './parser.service';
import { UrlDto } from '../urls/dto/url-dto';

@Controller('parse')
export class ParserController {
  constructor(private readonly parserService: ParserService) {}

  @Post('/content')
  // @Roles(Role.ADMIN)
  async checkUrl(@Body() url: UrlDto): Promise<any> {
    await this.parserService.parseContent(url);
  }
}
