import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { HEADER_REQUEST, SITEMAP_VARIANTS_LIST } from '../common/constants';
import { lastValueFrom } from 'rxjs';
import {
  SitemapCheckResult,
  SitemapListResult,
} from '../common/types/sitemap.types';

@Injectable()
export class SitemapService {
  constructor(private readonly httpService: HttpService) {}

  async getValidSitemapUrl(siteUrl: string): Promise<string[]> {
    const isSitemapExist: string[] =
      await this.getSitemapFromRobotsTxt(siteUrl);
    if (isSitemapExist && isSitemapExist.length) {
      return isSitemapExist;
    }

    const sitemapUrl: string[] = [];
    for (const sitemap of SITEMAP_VARIANTS_LIST) {
      const { url, status } = await this.getSitemapUrl(`${siteUrl}${sitemap}`);

      if (status === HttpStatus.OK) {
        sitemapUrl.push(url);
      }
    }

    return sitemapUrl;
  }

  async getSitemapUrl(url: string): Promise<{
    url: string;
    status: number;
    error: null | string;
  }> {
    try {
      const { status } = await lastValueFrom(
        this.httpService.get(url, HEADER_REQUEST),
      );
      return {
        url,
        status,
        error: null,
      };
    } catch (error) {
      return {
        url,
        status: 404,
        error: error.message,
      };
    }
  }

  async getSitemapFromRobotsTxt(websiteUrl: string) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get(`${websiteUrl}robots.txt`, HEADER_REQUEST),
      );
      const sitemapUrls: string[] = [];

      const lines = data.split('\n');
      for (const line of lines) {
        const match = line.match(/^[Ss]itemap:\s*(.+)$/);
        if (match) {
          sitemapUrls.push(match[1].trim());
        }
      }
      return sitemapUrls;
    } catch (error) {
      return [];
    }
  }

  // PRO
  async getValidSitemapUrlWithDetails(
    siteUrl: string,
  ): Promise<SitemapListResult> {
    const { sitemapUrls, robotsTxtStatus, blockedForGooglebot } =
      await this.getSitemapFromRobots(siteUrl);

    const urlsToCheck: string[] = sitemapUrls.length
      ? sitemapUrls
      : SITEMAP_VARIANTS_LIST.map((s) => `${siteUrl}${s}`);

    const sitemapList: SitemapCheckResult[] = [];

    for (const url of urlsToCheck) {
      const result = await this.checkSitemapUrl(url);
      if (result.httpStatus === HttpStatus.OK) {
        sitemapList.push({
          ...result,
          declaredInRobots: sitemapUrls.includes(url),
          blockedForGooglebot,
        });
      }
    }

    return { sitemapList, robotsTxtStatus };
  }

  async getSitemapFromRobots(websiteUrl: string): Promise<{
    sitemapUrls: string[];
    robotsTxtStatus: 'found' | 'not_found' | 'error';
    blockedForGooglebot: boolean;
  }> {
    try {
      const { data, status } = await lastValueFrom(
        this.httpService.get(`${websiteUrl}robots.txt`, HEADER_REQUEST),
      );

      if (status !== HttpStatus.OK) {
        return {
          sitemapUrls: [],
          robotsTxtStatus: 'not_found',
          blockedForGooglebot: false,
        };
      }

      const lines: string[] = data.split('\n').map((l: string) => l.trim());
      const sitemapUrls: string[] = [];
      let currentUserAgent = '';
      let googlebotDisallowAll = false;

      for (const line of lines) {
        if (line.match(/^User-agent:/i)) {
          currentUserAgent = line.split(':')[1].trim();
        }

        // Перевірка блокування Googlebot
        if (
          (currentUserAgent === 'Googlebot' || currentUserAgent === '*') &&
          line.match(/^Disallow:\s*\/$/i)
        ) {
          googlebotDisallowAll = true;
        }

        const match = line.match(/^[Ss]itemap:\s*(.+)$/);
        if (match) {
          sitemapUrls.push(match[1].trim());
        }
      }

      return {
        sitemapUrls,
        robotsTxtStatus: 'found',
        blockedForGooglebot: googlebotDisallowAll,
      };
    } catch {
      return {
        sitemapUrls: [],
        robotsTxtStatus: 'error',
        blockedForGooglebot: false,
      };
    }
  }

  private async checkSitemapUrl(
    url: string,
  ): Promise<
    Omit<SitemapCheckResult, 'declaredInRobots' | 'blockedForGooglebot'>
  > {
    const start = Date.now();
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, { ...HEADER_REQUEST, timeout: 10000 }),
      );
      return {
        url,
        httpStatus: response.status,
        responseTimeMs: Date.now() - start,
      };
    } catch (error) {
      return {
        url,
        httpStatus: error?.response?.status ?? 0,
        responseTimeMs: Date.now() - start,
      };
    }
  }
}
