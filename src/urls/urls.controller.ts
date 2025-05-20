import {
  Body,
  Controller,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { WpDetectService } from '../wp-detect/wp-detect.service';
import { UrlsService } from './urls.service';
import { SitemapDataDto } from './dto/sitemap-data.dto';
import { AnalyticsService } from '../static-analytics/analytics.service';
import { UrlHostDto } from './dto/url-host.dto';
import { validateUrl } from '../helpers';
import { SitemapTestDto } from './dto/sitemap-test.dto';

@Controller('urls')
export class UrlsController {
  constructor(
    private readonly wpDetectService: WpDetectService,
    private readonly urlsService: UrlsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('/wp-check')
  async detectWP(@Body() urlHostDto: UrlHostDto): Promise<{
    data: {
      isWp: boolean;
      url: string;
    };
    statusCode: number;
    error: string | null;
  }> {
    try {
      const { url } = urlHostDto;
      const validatedUrl = await validateUrl(url);
      const result = await this.wpDetectService.checkWebsiteIsWP(validatedUrl);

      if (result?.code && result?.code === 'ENOTFOUND') {
        return {
          data: {
            isWp: false,
            url: result.hostname,
          },
          statusCode: HttpStatus.NOT_FOUND,
          error: `Website ${result.hostname} not found / url is incorrect`,
        };
      }

      const findHost = await this.analyticsService.findHostname({
        url: validatedUrl,
        host: urlHostDto.host,
      });
      // TODO: improve code as a separate service
      if (!findHost) {
        await this.analyticsService.createWpCheckAnalytic({
          website: validatedUrl,
          tries: 1,
          host: urlHostDto.host,
          wpDetect: result.isWp,
        });
      } else {
        await this.analyticsService.updateAnalytic({
          website: findHost.website,
          host: findHost.host,
          tries: findHost.tries,
          wpDetect: result.isWp,
        });
      }

      return {
        data: result,
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (err) {
      return {
        data: {
          isWp: false,
          url: urlHostDto.url,
        },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: err.message || 'Unexpected error occurred during detection',
      };
    }
  }

  @Post('/sitemap-parse')
  async parseSitemap(@Body() sitemapDataDto: SitemapDataDto) {
    const { url, classNames } = sitemapDataDto;
    return await this.urlsService.sitemapListParse({ url }, classNames);
  }

  @Post('/sitemap-check')
  async detectSitemap(@Body() sitemapTestDto: SitemapTestDto) {
    try {
      const validUrl = await validateUrl(sitemapTestDto.url);
      const result =
        await this.urlsService.checkWebsiteHasSitemapUrl(sitemapTestDto);
      const findHost = await this.analyticsService.findHostnameSitemap({
        url: validUrl,
        host: sitemapTestDto.host,
      });

      if (!findHost) {
        await this.analyticsService.createSitemapTestAnalytic({
          website: validUrl,
          tries: 1,
          host: sitemapTestDto.host,
          status: result.length !== 0,
        });
      } else {
        await this.analyticsService.updateSitemapTestAnalytic({
          website: findHost.website,
          host: findHost.host,
          tries: findHost.tries,
          status: result.length !== 0,
        });
      }

      if (result.length === 0)
        throw new Error('Website is not WP or does not have sitemap');

      return {
        data: result,
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      throw new NotFoundException({
        message: error.message,
      });
    }
  }

  @Post('/sitemap-extract')
  async extractSitemapList(@Body() urlHostDto: UrlHostDto) {
    try {
      const sitemapList =
        await this.urlsService.getSitemapExtractedList(urlHostDto);
      if (sitemapList.length === 0)
        throw new Error('Website does not have sitemap or url is incorrect');

      return {
        data: sitemapList,
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      throw new NotFoundException({
        message: error.message,
      });
    }
  }

  @Post('/grab-links')
  async grabLinks(@Body() urlHostDto: UrlHostDto) {
    try {
      const grabbedLinks = await this.urlsService.grabLinks(urlHostDto);

      if (grabbedLinks?.response?.statusCode === HttpStatus.BAD_REQUEST) {
        throw new Error(grabbedLinks.response);
      }
      return grabbedLinks;
    } catch (error) {
      throw new NotFoundException({
        message: error.message,
      });
    }
  }
}
