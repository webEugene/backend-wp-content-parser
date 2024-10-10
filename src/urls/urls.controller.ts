import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { WpDetectService } from '../wp-detect/wp-detect.service';
import { UrlDto } from './dto/url-dto';
import { UrlsService } from './urls.service';

@Controller('urls')
export class UrlsController {
  constructor(
    private readonly wpDetectService: WpDetectService,
    private readonly urlsService: UrlsService,
  ) {}

  @Post()
  async checkUrl(@Body() url: UrlDto): Promise<any> {
    const result = await this.wpDetectService.checkWebsiteIsWP(url);

    if (result?.code && result?.code === 'ENOTFOUND') {
      return {
        data: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: `Website ${url.url} not found or url is incorrect`,
      };
    }

    return {
      data: result,
      statusCode: HttpStatus.OK,
      error: null,
    };
  }

  @Post('/sitemap-parse')
  async parseSitemap(@Body() url: UrlDto) {
    return await this.urlsService.sitemapListParse(url);
  }
}
