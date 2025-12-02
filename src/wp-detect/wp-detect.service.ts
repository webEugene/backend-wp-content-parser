import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as cheerio from 'cheerio';
import { HEADER_REQUEST } from '../common/constants';

@Injectable()
export class WpDetectService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly httpService: HttpService,
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
