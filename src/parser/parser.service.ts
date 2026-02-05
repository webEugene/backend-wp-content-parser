import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import puppeteer from 'puppeteer';
import {
  cleanHostname,
  validateUrl,
  formattingContent,
  createCriteria,
  findCurrentPage,
} from '../helpers';
import { saveParsedDataToCsv } from '../helpers/saveParsedDataToCsv';
import * as cheerio from 'cheerio';
import { ParsingDataDto } from './dto/parsing-data.dto';
import { getSitemapList } from '../helpers/getSitemapList';
import { UrlHostDto } from '../urls/dto/url-host.dto';
import { HEADER_REQUEST } from '../common/constants';

interface BlockDetection {
  isBlocked: boolean;
  blockerType: string | null;
  indicators: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
  recommendation?: string;
}

interface DebugInfo {
  contentLength: number;
  title: string;
  finalUrl: string;
  redirected: boolean;
  loadTime: number;
  timestamp: string;
}

interface ParseResult {
  success: boolean;
  status: 'success' | 'error' | 'blocked';
  statusCode: number;
  url: string;
  message: string;

  // Content
  content: string | null;

  // Security & Detection
  blockDetection: BlockDetection;

  // Debug & Meta
  debug?: DebugInfo;
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  // Timestamps
  requestedAt: string;
  respondedAt: string;
  duration: number; // in ms
}

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
      const { data } = await lastValueFrom(
        this.httpService.get(url, HEADER_REQUEST),
      );
      const $ = cheerio.load(data);
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
      debug?: boolean; // Add debugging option
    },
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const requestedAt = new Date().toISOString();

    const {
      returnContent = true,
      returnStatusOnly = false,
      delayMs = 4000,
      debug = false,
    } = options ?? {};

    let browser = null;
    let content: string | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        devtools: false,
        args: [
          // '--no-sandbox',
          // '--disable-setuid-sandbox',
          // '--remote-debugging-port=0',
          // '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--remote-debugging-port=0',
          '--window-size=1920,1080',
        ],
      });

      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // More realistic headers
      await page.setExtraHTTPHeaders({
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      // Set a realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      );

      // Enhanced anti-detection
      await page.evaluateOnNewDocument(() => {
        // Overwrite the `navigator.webdriver` property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });

        // Overwrite the `plugins` property to use a custom getter
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Overwrite the `languages` property
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Pass the Chrome Test
        (window as any).chrome = {
          runtime: {},
        };

        // Pass the Permissions Test
        const originalQuery = (window.navigator.permissions as any).query;
        (window.navigator.permissions as any).query = (parameters: any) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission } as any)
            : originalQuery(parameters);

        // Additional properties
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
        });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      });

      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      const statusCode = response?.status() ?? 500;
      const initialUrl = response?.url() || url;

      // Delay for JS-rendered content
      await new Promise((r) => setTimeout(r, delayMs));

      // Optional: Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // -------- GET CONTENT BEFORE CLOSING BROWSER --------
      if (!returnStatusOnly && returnContent) {
        content = await page.content();
      }

      // Collect debug info
      const debugInfo = await page.evaluate(() => ({
        contentLength: document.documentElement.outerHTML.length,
        title: document.title,
        finalUrl: window.location.href,
      }));

      // Detect blocking
      const rawBlockDetection = await page.evaluate(() => {
        const indicators: string[] = [];
        let blockerType: string | null = null;

        // Cloudflare
        if (
          document.title.toLowerCase().includes('just a moment') ||
          document.title.toLowerCase().includes('attention required') ||
          document.body?.innerHTML.includes('__cf_chl_opt') ||
          document.body?.innerHTML.includes('cf-wrapper') ||
          document.querySelector('[id*="cf-"]') ||
          document.querySelector('.cf-browser-verification')
        ) {
          indicators.push('Cloudflare challenge page detected');
          blockerType = 'Cloudflare';
        }

        const metaTags = Array.from(document.querySelectorAll('meta'));
        if (
          metaTags.some(
            (tag) =>
              tag.getAttribute('name')?.includes('cf-') ||
              tag.getAttribute('content')?.includes('cloudflare'),
          )
        ) {
          indicators.push('Cloudflare meta tags found');
          blockerType = blockerType || 'Cloudflare';
        }

        // PerimeterX
        if (
          document.body?.innerHTML.includes('perimeterx') ||
          document.body?.innerHTML.includes('_px') ||
          (window as any)._pxAppId ||
          document.querySelector('[id*="px-captcha"]')
        ) {
          indicators.push('PerimeterX/HUMAN detected');
          blockerType = 'PerimeterX';
        }

        // DataDome
        if (
          document.body?.innerHTML.includes('datadome') ||
          document.cookie.includes('datadome') ||
          document.querySelector('[id*="datadome"]') ||
          (window as any).ddCaptcha
        ) {
          indicators.push('DataDome detected');
          blockerType = 'DataDome';
        }

        // Incapsula
        if (
          document.body?.innerHTML.includes('incapsula') ||
          document.body?.innerHTML.includes('_Incapsula') ||
          document.cookie.includes('incap_ses') ||
          document.cookie.includes('visid_incap')
        ) {
          indicators.push('Incapsula/Imperva detected');
          blockerType = 'Incapsula';
        }

        // reCAPTCHA
        if (
          document.querySelector('.g-recaptcha') ||
          document.querySelector('[id*="recaptcha"]') ||
          document.body?.innerHTML.includes('recaptcha') ||
          (window as any).grecaptcha
        ) {
          indicators.push('reCAPTCHA detected');
          blockerType = blockerType || 'reCAPTCHA';
        }

        // hCaptcha
        if (
          document.querySelector('.h-captcha') ||
          document.body?.innerHTML.includes('hcaptcha') ||
          (window as any).hcaptcha
        ) {
          indicators.push('hCaptcha detected');
          blockerType = blockerType || 'hCaptcha';
        }

        // Access denied
        if (
          document.title.toLowerCase().includes('access denied') ||
          document.title.toLowerCase().includes('forbidden') ||
          document.body?.innerText.toLowerCase().includes('access denied') ||
          document.body?.innerText.toLowerCase().includes('blocked')
        ) {
          indicators.push('Access denied message found');
          blockerType = blockerType || 'Generic Block';
        }

        // Akamai
        if (
          document.body?.innerHTML.includes('akamai') ||
          document.cookie.includes('ak_bmsc')
        ) {
          indicators.push('Akamai detected');
          blockerType = blockerType || 'Akamai';
        }

        // Kasada
        if (
          document.body?.innerHTML.includes('kasada') ||
          (window as any).KPSDK
        ) {
          indicators.push('Kasada detected');
          blockerType = blockerType || 'Kasada';
        }

        // Shape Security
        if (
          document.body?.innerHTML.includes('shape-security') ||
          document.cookie.includes('_abck')
        ) {
          indicators.push('Shape Security detected');
          blockerType = blockerType || 'Shape Security';
        }

        return {
          isBlocked: indicators.length > 0,
          blockerType,
          indicators,
        };
      });

      await browser.close();
      browser = null;

      // Build structured response
      const endTime = Date.now();
      const respondedAt = new Date().toISOString();

      // Determine severity and recommendation
      const severity = this.determineSeverity(rawBlockDetection);
      const recommendation = this.getRecommendation(rawBlockDetection);

      // Build block detection with enhanced info
      const blockDetection: BlockDetection = {
        ...rawBlockDetection,
        severity,
        recommendation,
      };

      // Determine final status
      let finalStatus: 'success' | 'error' | 'blocked' = 'success';
      let message = 'Successfully retrieved content';

      if (blockDetection.isBlocked) {
        finalStatus = 'blocked';
        message = `Access blocked by ${blockDetection.blockerType}`;
      } else if (statusCode >= 400) {
        finalStatus = 'error';
        message = `HTTP error: ${statusCode}`;
      }

      return {
        success: finalStatus === 'success',
        status: finalStatus,
        statusCode,
        url: initialUrl,
        message,
        content: returnContent ? content : null,
        blockDetection,
        ...(debug && {
          debug: {
            ...debugInfo,
            redirected: initialUrl !== url,
            loadTime: endTime - startTime,
            timestamp: new Date().toISOString(),
          },
        }),
        requestedAt,
        respondedAt,
        duration: endTime - startTime,
      };
    } catch (err: any) {
      if (browser) await browser.close();

      const endTime = Date.now();
      const respondedAt = new Date().toISOString();

      return {
        success: false,
        status: 'error',
        statusCode: err.statusCode || 500,
        url,
        message: err.message || 'Failed to retrieve content',
        content: null,
        blockDetection: {
          isBlocked: false,
          blockerType: null,
          indicators: [],
          severity: 'none',
        },
        error: {
          code: err.code || 'UNKNOWN_ERROR',
          message: err.message,
          details: err.stack,
        },
        requestedAt,
        respondedAt,
        duration: endTime - startTime,
      };
    }
  }

  private determineSeverity(blockDetection: {
    isBlocked: boolean;
    blockerType: string | null;
  }): 'none' | 'low' | 'medium' | 'high' {
    if (!blockDetection.isBlocked) return 'none';

    const highSeverityBlockers = [
      'Cloudflare',
      'PerimeterX',
      'DataDome',
      'Kasada',
    ];
    const mediumSeverityBlockers = ['Incapsula', 'Akamai', 'Shape Security'];

    if (highSeverityBlockers.includes(blockDetection.blockerType || '')) {
      return 'high';
    } else if (
      mediumSeverityBlockers.includes(blockDetection.blockerType || '')
    ) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private getRecommendation(blockDetection: {
    isBlocked: boolean;
    blockerType: string | null;
  }): string | undefined {
    if (!blockDetection.isBlocked) return undefined;

    const recommendations: Record<string, string> = {
      Cloudflare:
        'Use residential proxies, implement browser fingerprint rotation, or use Cloudflare solver services',
      PerimeterX:
        'Implement advanced browser fingerprinting evasion and consider using specialized anti-bot services',
      DataDome:
        'Use residential proxies with consistent sessions and implement human-like behavior patterns',
      Incapsula:
        'Rotate IP addresses and user agents, implement cookie management',
      Akamai:
        'Use high-quality residential proxies and implement TLS fingerprint randomization',
      reCAPTCHA:
        'Implement CAPTCHA solving service or use authenticated sessions',
      hCaptcha: 'Use CAPTCHA solving service or manual intervention',
      'Generic Block':
        'Review access logs, check IP reputation, and verify request headers',
    };

    return (
      recommendations[blockDetection.blockerType || ''] ||
      'Contact support or use alternative access methods'
    );
  }
}
