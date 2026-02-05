import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as cheerio from 'cheerio';
import { HEADER_REQUEST } from '../common/constants';
import { ParserService } from '../parser/parser.service';
import { FrameworkDetectorService } from '../framework-detector/framework-detector.service';

@Injectable()
export class WpDetectService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly httpService: HttpService,
    private readonly parserService: ParserService,
    private readonly frameworkDetectorService: FrameworkDetectorService,
  ) {}

  async checkWebsiteIsWP(websiteUrl: string): Promise<{
    isWp: boolean;
    url: string;
    code?: string;
    hostname?: string;
  }> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get(websiteUrl, HEADER_REQUEST),
      );
      const $ = cheerio.load(data);
      const head = $('head').prop('outerHTML');

      const hasWpTheme: string = await this.getTheme(head);
      const hasWpPlugins: any[] = await this.getPlugins(head);

      if (!hasWpTheme && hasWpPlugins.length === 0) {
        return {
          isWp: false,
          url: websiteUrl,
        };
      }

      if (hasWpTheme && hasWpPlugins.length === 0) {
        return {
          isWp: true,
          url: websiteUrl,
        };
      }

      return {
        isWp: hasWpTheme && hasWpPlugins.length > 0,
        url: websiteUrl,
      };
    } catch (error) {
      const code = error.code || (error.cause?.code ?? null);

      return {
        isWp: false,
        url: websiteUrl,
        code,
      };
    }
  }

  async checkWebsiteDetail(websiteUrl: string): Promise<{
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
  }> {
    try {
      const result = await this.parserService.parseHtmlByPuppeteer(websiteUrl, {
        debug: true,
        delayMs: 5000,
      });

      // Early return if there's an error
      if (result.error) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
      }

      // Ensure content exists
      if (!result.content) {
        throw new Error('No content received from parser');
      }

      const $ = cheerio.load(result.content);
      const head = $('head').prop('outerHTML') || '';

      // Detect WordPress components
      const [hasWpTheme, hasWpPlugins] = await Promise.all([
        this.getTheme(head),
        this.getPlugins(head),
      ]);

      const isWordPress = Boolean(hasWpTheme) || hasWpPlugins.length > 0;

      // Build block detection object
      const blockDetection = {
        isBlocked: result.blockDetection?.isBlocked ?? false,
        blockerType: result.blockDetection?.blockerType ?? null,
        indicators: result.blockDetection?.indicators ?? [],
        severity: result.blockDetection?.severity ?? ('none' as const),
        recommendation: result.blockDetection?.recommendation ?? '',
      };

      // If not WordPress, detect other frameworks
      if (!isWordPress) {
        const frameworkDetection = await this.frameworkDetectorService.detect(
          result.content,
        );

        return {
          isWp: false,
          url: websiteUrl,
          framework: frameworkDetection.framework,
          blockDetection,
        };
      }

      // Return WordPress detection result
      return {
        isWp: true,
        url: websiteUrl,
        framework: 'wordpress',
        blockDetection,
      };
    } catch (error) {
      // Handle errors gracefully
      const errorCode = error?.code || 'UNKNOWN_ERROR';
      const errorMessage = error?.message || 'An unexpected error occurred';

      return {
        isWp: false,
        url: websiteUrl,
        code: errorCode,
        message: errorMessage,
      };
    }
  }

  async getTheme(body: string): Promise<string> {
    const theme = /\/themes\/[A-Z-a-z-0-9]+\//.exec(body);
    let themeName: string = null;
    if (theme !== null && theme[0])
      themeName = theme[0].replace('/themes/', '').replace('/', '');

    return themeName;
  }

  async getPlugins(body: string): Promise<any[]> {
    const plugins = body.match(/\/plugins\/[A-Z-a-z-0-9]+\//g);
    let pluginsList: string[] = [];

    if (plugins !== null && plugins[0]) {
      // If the declaration is misinformed
      if (plugins[0].length > 800) return [];

      pluginsList = plugins.map((p) =>
        p.replace('/plugins/', '').replace('/', ''),
      );
      return [...new Set(pluginsList)];
    }

    return [];
  }
}
