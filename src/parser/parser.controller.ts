import { Body, Controller, Post } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParsingDataDto } from './dto/parsing-data.dto';
import { cleanHostname, createCriteria, isExistHostFile, validateUrl } from '../helpers';
import { UrlsService } from '../urls/urls.service';
import { SITEMAP_URLS_DIR } from '../common/constants';
import { ClassNamesType } from '../common/types/ClassNamesType';

@Controller('parse')
export class ParserController {
  constructor(
    private readonly parserService: ParserService,
    private readonly urlsService: UrlsService,
  ) {}

  @Post('/content')
  // @Roles(Role.ADMIN)
  async checkUrl(@Body() parsingContentDto: ParsingDataDto): Promise<any> {
    // Step 1: Create file with sitemaps
    await this.urlsService.sitemapListParse({
      url: parsingContentDto.url,
    });
    // Step 2: Check if file is exist
    const isFileSitemapExist: boolean = await isExistHostFile({
      host: cleanHostname(parsingContentDto.url),
      directory: SITEMAP_URLS_DIR,
      fileName: '_sitemap_url',
    });
    if (!isFileSitemapExist) return;
    // Step 3: Create criteria


    // Step 4: Parsing content
    return await this.parserService.parseContent(parsingContentDto);
  }
}
