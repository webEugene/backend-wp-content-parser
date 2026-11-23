import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WpDetectService } from '../wp-detect/wp-detect.service';
import { UrlsService } from './urls.service';
import { UrlHostDto } from './dto/url-host.dto';
import { validateUrl } from '../helpers';
import { SitemapTestDto } from './dto/sitemap-test.dto';
import { UrlDto } from './dto/url-dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { AnalyzerResult } from '../analyzer/types/analyzer-result.type';

interface WPCheckResponse {
  data: {
    isWp: boolean;
    url: string;
    framework?: string;
  };
  statusCode: number;
  error: string | null;
}

interface ClientWPCheckResponse {
  data: {
    isWp: boolean;
    url: string;
    framework?: string;
    code?: string;
    message?: string;
    blockDetection?: {
      isBlocked: boolean;
      blockerType?: string | null;
      indicators?: string[];
      severity?: 'none' | 'low' | 'medium' | 'high';
      recommendation?: string;
    };
  };
  statusCode: number;
  error: string | null;
}

interface SitemapExtractResponse {
  data: {
    total: number;
    allowedLinks: string[];
  };
  statusCode: number;
  error: null;
}

@Controller('urls')
export class UrlsController {
  constructor(
    private readonly wpDetectService: WpDetectService,
    private readonly urlsService: UrlsService,
    private readonly analyzer: AnalyzerService,
  ) {}

  @Post('/wp-check')
  @HttpCode(HttpStatus.OK)
  async detectWP(@Body() urlHostDto: UrlHostDto): Promise<WPCheckResponse> {
    try {
      const validatedUrl = await this.validateUrlSafe(urlHostDto.url);
      const result = await this.wpDetectService.checkWebsiteIsWP(validatedUrl);

      if (this.isNotFoundError(result)) {
        return this.createNotFoundResponse(result.hostname);
      }

      return this.createSuccessResponse(result);
    } catch (err) {
      return this.createErrorResponse(urlHostDto.url, err);
    }
  }

  @Post('/client-wp-check')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async clientWPCheck(@Body() urlDto: UrlDto): Promise<ClientWPCheckResponse> {
    try {
      const validatedUrl = await this.validateUrlSafe(urlDto.url);
      const result =
        await this.wpDetectService.checkWebsiteDetail(validatedUrl);

      if (this.isNotFoundError(result)) {
        return {
          data: {
            isWp: false,
            url: result.url,
          },
          statusCode: HttpStatus.NOT_FOUND,
          error: `Website ${result.url} not found / url is incorrect`,
        };
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
          url: urlDto.url,
        },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: err.message || 'Unexpected error occurred during detection',
      };
    }
  }

  @Post('/client-sitemap-list')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getClientSitemapList(@Body() urlDto: UrlDto) {
    const result = await this.urlsService.getWebsiteSitemapList(urlDto);

    if (result.sitemapList.length === 0) {
      throw new NotFoundException('Website does not have sitemap');
    }

    return {
      data: result,
      statusCode: HttpStatus.OK,
      error: null,
    };
  }

  @Post('/client-grab-links')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async clientGrabLinks(@Body() urlDto: UrlDto): Promise<AnalyzerResult> {
    return await this.analyzer.analyze(urlDto.url);
  }

  @Post('/sitemap-parse')
  @HttpCode(HttpStatus.OK)
  async parseSitemap(@Body() urlDto: UrlDto) {
    return await this.urlsService.sitemapListParse(urlDto);
  }

  @Post('/sitemap-check')
  @HttpCode(HttpStatus.OK)
  async detectSitemap(@Body() sitemapTestDto: SitemapTestDto) {
    const result =
      await this.urlsService.checkWebsiteHasSitemapUrlFree(sitemapTestDto);

    if (result.length === 0) {
      throw new NotFoundException('Website is not WP or does not have sitemap');
    }

    return {
      data: result,
      statusCode: HttpStatus.OK,
      error: null,
    };
  }

  @Post('/sitemap-extract')
  @HttpCode(HttpStatus.OK)
  async extractSitemapList(
    @Body() urlHostDto: UrlHostDto,
  ): Promise<SitemapExtractResponse> {
    const sitemapList = await this.urlsService.getSitemapExtractedList(
      urlHostDto,
      true,
    );

    if (sitemapList.length === 0) {
      throw new NotFoundException(
        'Website does not have sitemap or url is incorrect',
      );
    }

    return {
      data: sitemapList,
      statusCode: HttpStatus.OK,
      error: null,
    };
  }

  @Post('/grab-links')
  @HttpCode(HttpStatus.OK)
  async grabLinks(@Body() urlHostDto: UrlHostDto) {
    const grabbedLinks = await this.urlsService.grabLinks(urlHostDto);

    if (grabbedLinks?.response?.statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(grabbedLinks.response);
    }

    return grabbedLinks;
  }

  // Private helper methods
  private async validateUrlSafe(url: string): Promise<string> {
    try {
      return await validateUrl(url);
    } catch (error) {
      throw new BadRequestException('Invalid URL format');
    }
  }

  private isNotFoundError(result: any): boolean {
    return result?.code === 'ENOTFOUND';
  }

  private createNotFoundResponse(hostname: string): WPCheckResponse {
    return {
      data: {
        isWp: false,
        url: hostname,
      },
      statusCode: HttpStatus.NOT_FOUND,
      error: `Website ${hostname} not found / url is incorrect`,
    };
  }

  private createSuccessResponse(result: any): WPCheckResponse {
    return {
      data: result,
      statusCode: HttpStatus.OK,
      error: null,
    };
  }

  private createErrorResponse(url: string, error: any): WPCheckResponse {
    return {
      data: {
        isWp: false,
        url,
      },
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: error.message || 'Unexpected error occurred during detection',
    };
  }
  /**
  private async trackWpCheckAnalytics(
    website: string,
    host: string,
    wpDetect: boolean,
  ): Promise<void> {
    const existingHost = await this.analyticsService.findHostname({
      url: website,
      host,
    });

    if (!existingHost) {
      await this.analyticsService.createWpCheckAnalytic({
        website,
        tries: 1,
        host,
        wpDetect,
      });
    } else {
      await this.analyticsService.updateAnalytic({
        website: existingHost.website,
        host: existingHost.host,
        tries: existingHost.tries,
        wpDetect,
      });
    }
  } */

  /**
  private async trackSitemapAnalytics(
    website: string,
    host: string,
    status: boolean,
  ): Promise<void> {
    const existingHost = await this.analyticsService.findHostnameSitemap({
      url: website,
      host,
    });

    if (!existingHost) {
      await this.analyticsService.createSitemapTestAnalytic({
        website,
        tries: 1,
        host,
        status,
      });
    } else {
      await this.analyticsService.updateSitemapTestAnalytic({
        website: existingHost.website,
        host: existingHost.host,
        tries: existingHost.tries,
        status,
      });
    }
  }

    */
}
