import { Body, Controller, Post } from '@nestjs/common';
import { ParserService } from './parser.service';
import { UrlsService } from '../urls/urls.service';
import { ParsingDataDto } from './dto/parsing-data.dto';
import { UrlHostDto } from '../urls/dto/url-host.dto';

@Controller('parse')
export class ParserController {
  constructor(
    private readonly parserService: ParserService,
    private readonly urlsService: UrlsService,
  ) {}

  @Post('/content')
  async parseContent(@Body() parsingContentDto: ParsingDataDto): Promise<any> {
    await this.urlsService.sitemapListParse({
      url: parsingContentDto.url,
    });

    return await this.parserService.parseContent(parsingContentDto);
  }

  @Post('/classes')
  async parseClasses(@Body() urlHostDto: UrlHostDto): Promise<any> {
    await this.urlsService.sitemapListParse({
      url: urlHostDto.url,
    });

    return await this.parserService.parseClasses(urlHostDto);
  }
}
