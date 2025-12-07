import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  cleanHostname,
  createCriteria,
  findCurrentPage,
  formattingContent,
  validateUrl,
} from '../helpers';
import { saveParsedDataToCsv } from '../helpers/saveParsedDataToCsv';
import * as cheerio from 'cheerio';
import { ParsingDataDto } from './dto/parsing-data.dto';
import { getSitemapList } from '../helpers/getSitemapList';
import { UrlHostDto } from '../urls/dto/url-host.dto';
import { HEADER_REQUEST } from '../common/constants';
import puppeteer from 'puppeteer';

@Injectable()
export class ParserService {
  constructor(private readonly httpService: HttpService) {}

  async parseContent(data: ParsingDataDto) {
    const { url } = data;

    const validatedUrl = await validateUrl(url);
    const webHost: string = cleanHostname(validatedUrl);
    const getCriteriaList = createCriteria(data);
    const sitemapUrls = await getSitemapList(webHost);

    return await this.parseContentByUrls(webHost, sitemapUrls, getCriteriaList);
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async parseContentByUrls(host: string, urlsList: string[], siteCriteria) {
    const gatherData: any[] = [];

    for (const pageUrl of urlsList) {
      try {
        const { data } = await lastValueFrom(
          this.httpService.get(pageUrl, HEADER_REQUEST),
        );
        if (!data) {
          console.warn(`Skipping page ${pageUrl} (empty data or 404)`);
          continue;
        }

        const formattedData = formattingContent(data, siteCriteria, pageUrl);
        gatherData.push(formattedData);
      } catch (e) {
        console.error(`Failed to parse ${pageUrl}: ${e.message}`);
      }

      // Delay between requests to avoid overloading the server
      await this.delay(500 + Math.random() * 500);
    }

    await saveParsedDataToCsv(host, gatherData);
    return gatherData;
  }

  async grabAllLinksFromPage(url: string, domainOrigin: string) {
    try {
      const page = await this.parseHtmlByPuppeteer(url);

      const $ = cheerio.load(page);
      const links = [];

      // Select all anchor tags and extract href attributes
      $(`a:link:not([href^=javascript])`).each((index, element) => {
        const link = $(element).attr('href');
        const title = $(element).text().trim();
        const domainExtracted =
          link.startsWith('http://') || link.startsWith('https://')
            ? new URL(link)
            : link;

        if (link && link.trim() !== '') {
          links.push({
            link: link === '/' || link === '#' ? domainOrigin : link,
            title,
            origin:
              typeof domainExtracted === 'object'
                ? domainExtracted.origin
                : domainExtracted,
          });
        }
      });

      return links;
    } catch (e) {
      throw new BadRequestException(
        'Something bad happened while grabbing links',
        {
          cause: new Error(),
          description: `${e.message}`,
        },
      );
    }
  }

  async parseClasses(urlHostDto: UrlHostDto) {
    const validatedUrl = await validateUrl(urlHostDto.url);
    const webHost: string = cleanHostname(validatedUrl);
    const sitemapUrls = await getSitemapList(webHost);
    const getPages = await this.parseClassesFromUrls(sitemapUrls);

    return {
      site: urlHostDto.url,
      pages: getPages,
    };
  }

  async parseClassesFromUrls(urls: string[]) {
    const gatherData = new Set<string>();

    for (const pageUrl of urls) {
      try {
        const { data } = await lastValueFrom(
          this.httpService.get(pageUrl, HEADER_REQUEST),
        );
        if (!data) {
          console.warn(`Skipping page ${pageUrl} (empty data or 404)`);
          continue;
        }

        const $ = cheerio.load(data);
        const bodyClass = $('body').attr('class')?.trim();
        if (!bodyClass) {
          console.warn(`[WARNING] Page ${pageUrl} — Body class not found`);
          continue;
        }

        const currentPage = findCurrentPage(bodyClass);

        if (!currentPage) {
          console.warn(`[WARN] Page ${pageUrl} — Current page not found`);
          continue;
        }

        gatherData.add(currentPage);
      } catch (e) {
        console.error(`Failed to parse ${pageUrl}: ${e.message}`);
      }
      // Delay between requests to avoid overloading the server
      await this.delay(10);
    }

    return Array.from(gatherData);
  }

  async parseHtmlByPuppeteer(
    url: string,
    options?: {
      returnContent?: boolean; // default: true
      returnStatusOnly?: boolean; // default: false
      delayMs?: number; // default: 4000
    },
  ): Promise<
    | { status: 'success' | 'error'; content?: string; url: string }
    | { status: 'success' | 'error'; url: string }
  > {
    const {
      returnContent = true,
      returnStatusOnly = false,
      delayMs = 4000,
    } = options ?? {};

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        ],
      });

      const page = await browser.newPage();

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
        });
      });

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const statusCode = response?.status() ?? null;

      // Delay to allow dynamic content
      await new Promise((r) => setTimeout(r, delayMs));

      await browser.close();

      // If user wants only status:
      if (returnStatusOnly) {
        return {
          status: statusCode && statusCode < 400 ? 'success' : 'error',
          url,
        };
      }

      // If full content is needed
      const content = returnContent ? await page.content() : undefined;

      return {
        status: 'success',
        url,
        content,
      };
    } catch (err) {
      return {
        status: 'error',
        url,
      };
    }
  }
}
