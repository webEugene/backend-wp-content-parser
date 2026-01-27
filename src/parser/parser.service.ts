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
import { XMLParser } from 'fast-xml-parser';

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

      const $ = cheerio.load(page.content!);
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
  ): Promise<{
    status: 'success' | 'error';
    statusCode: number;
    url: string;
    content: string | null; // <-- ALWAYS EXISTS
  }> {
    const {
      returnContent = true,
      returnStatusOnly = false,
      delayMs = 4000,
    } = options ?? {};

    let browser = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        devtools: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--remote-debugging-port=0',
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

      // Delay for JS-rendered content
      await new Promise((r) => setTimeout(r, delayMs));

      // -------- GET CONTENT BEFORE CLOSING BROWSER --------
      let content: string | null = null;

      if (!returnStatusOnly && returnContent) {
        content = await page.content();
      }

      await browser.close();
      browser = null;
      // -----------------------------------------------------

      return {
        status: statusCode && statusCode < 400 ? 'success' : 'error',
        statusCode,
        url,
        content,
      };
    } catch (err) {
      if (browser) await browser.close();

      return {
        status: 'error',
        statusCode: err.statusCode,
        url,
        content: null,
      };
    }
  }
  private visited = new Set<string>();
  async parseSitemap(url: string) {
    // avoid re-parsing
    if (this.visited.has(url)) return [];
    this.visited.add(url);

    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      allowBooleanAttributes: true,
      processEntities: true,
    });
    const browser = await puppeteer.launch({
      headless: true,
      devtools: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--remote-debugging-port=0',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      ],
    });

    try {
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
        waitUntil: 'networkidle2',
        timeout: 20000,
      });
      // ------------------------------------------------
      // Detect content type
      // ------------------------------------------------

      const contentType = response?.headers()['content-type'] || '';

      const text = await page.evaluate(() => {
        return document.documentElement.innerText || '';
      });

      const isXML =
        contentType.includes('xml') ||
        text.includes('<urlset') ||
        text.includes('<sitemapindex');

      // =================================================
      // 1️⃣ XML sitemap index / urlset
      // =================================================
      // console.log(111, isXML);
      // if (isXML) {
      //   return await this.parseXmlContent(text, url);
      // }

      // =================================================
      // 2️⃣ HTML Yoast sitemap page
      // =================================================

      const isHtmlSitemap = await page.evaluate(() => {
        return document.querySelector('#sitemap') !== null;
      });

      console.log(222, isHtmlSitemap);
      if (isHtmlSitemap) {
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('#sitemap a')).map(
            (a) => (a as HTMLAnchorElement).href,
          ),
        );
        console.log(links);
        const result: string[] = [];

        for (const link of links) {
          // recursively parse — whether xml or html doesn't matter here
          result.push(...(await this.parseSitemap(link)));
        }

        return result;
      }

      // normal HTML page → not a sitemap → return no recursion
      return [];
    } finally {
      await browser.close();
    }
  }

  private async parseXmlContent(text: string, url: string): Promise<string[]> {
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
    });

    let parsed;

    try {
      parsed = xmlParser.parse(text);
      console.log(333, parsed);
    } catch {
      throw new Error(`Invalid XML sitemap at ${url}`);
    }

    // XML index
    if (parsed.sitemapindex?.sitemap) {
      const list = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];

      const result: string[] = [];

      for (const sm of list) {
        result.push(...(await this.parseSitemap(sm.loc)));
      }

      return result;
    }

    // XML urlset
    if (parsed.urlset?.url) {
      const urls = Array.isArray(parsed.urlset.url)
        ? parsed.urlset.url
        : [parsed.urlset.url];

      return urls.map((u) => u.loc).filter(Boolean);
    }

    throw new Error(`Unknown XML format at ${url}`);
  }
}
