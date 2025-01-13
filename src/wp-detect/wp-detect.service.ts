import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { UrlDto } from '../urls/dto/url-dto';
import { validateUrl } from '../helpers';

@Injectable()
export class WpDetectService {
  constructor(private readonly httpService: HttpService) {}

  async checkWebsiteIsWP(websiteUrl: UrlDto): Promise<any> {
    try {
      const validUrl = await validateUrl(websiteUrl.url);
      const { data } = await lastValueFrom(this.httpService.get(validUrl));

      const hasWpTheme: string = await this.getTheme(data);
      const hasWpPlugins: any[] = await this.getPlugins(data);

      if (!hasWpTheme && hasWpPlugins.length === 0) return false;

      return hasWpTheme && hasWpPlugins.length > 0;
    } catch (error) {
      return error;
    }
  }
  async getTheme(body): Promise<string> {
    const theme = /\/themes\/[a-z-0-9]+\//.exec(body);
    let themeName;

    if (theme !== null && theme[0])
      themeName = theme[0].replace('/themes/', '').replace('/', '');

    return themeName;
  }

  async getPlugins(body): Promise<any[]> {
    let plugins = body.match(/\/plugins\/[a-z-0-9]+\//g);

    if (plugins !== null && plugins[0]) {
      // If the declaration is misinformed
      if (plugins[0].length > 800) return [];

      plugins = plugins.map((p) => p.replace('/plugins/', '').replace('/', ''));

      return [...new Set(plugins)];
    }

    return [];
  }
}
