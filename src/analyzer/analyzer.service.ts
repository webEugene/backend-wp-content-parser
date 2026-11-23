import { Injectable, Logger } from '@nestjs/common';
import { ParserService } from '../parser/parser.service';

// import { extractOverview } from './extractors/overview.extractor';
import { extractContacts } from './extractors/contacts.extractor';
import { extractSocial } from './extractors/social.extractor';
// import { extractLinks } from './extractors/links.extractor';
// import { extractTechnical } from './extractors/technical.extractor';

import { AnalyzerResult, AccessInfo } from './types/analyzer-result.type';

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  constructor(private readonly parserService: ParserService) {}

  async analyze(url: string): Promise<AnalyzerResult> {
    // 1. Один запуск Puppeteer для всього аналізу — дорога операція
    //    (launch браузера + 4с очікування), тож НІКОЛИ не викликати
    //    окремо на кожен екстрактор.
    const parseResult = await this.parserService.parseHtmlByPuppeteer(url, {
      returnContent: true,
      debug: false,
    });

    const access: AccessInfo = {
      statusCode: parseResult.statusCode,
      isBlocked: parseResult.blockDetection.isBlocked,
      blockerType: parseResult.blockDetection.blockerType,
      severity: parseResult.blockDetection.severity,
      recommendation: parseResult.blockDetection.recommendation,
    };

    // Якщо контент взагалі не отримали (мережева помилка, timeout) —
    // немає сенсу запускати екстрактори, повертаємо порожній результат
    // з інформацією про причину одразу в access.
    if (!parseResult.content) {
      this.logger.warn(
        `parseHtmlByPuppeteer failed for ${url}: ${parseResult.message}`,
      );

      return {
        access,
        // overview: null,
        contacts: null,
        social: null,
        // links: null,
        // technical: null,
      };
    }

    if (access.isBlocked) {
      this.logger.warn(
        `${url} flagged as blocked (${access.blockerType}), proceeding with extraction on available content`,
      );
    }

    const html = parseResult.content;
    // finalUrl з Puppeteer (після можливих редіректів) точніший за вхідний url
    const finalUrl = parseResult.url || url;
    // 2. Паралельний запуск усіх екстракторів над одним HTML
    const [contacts, social] = await Promise.allSettled([
      // extractOverview(html, finalUrl),
      extractContacts(html, finalUrl, { isBlocked: access.isBlocked }),
      extractSocial(html),
      // extractLinks(html, finalUrl),
      // extractTechnical(html, finalUrl),
    ]);

    return {
      access,
      // overview: this.unwrap(overview, 'overview'),
      contacts: this.unwrap(contacts, 'contacts'),
      social: this.unwrap(social, 'social'),
      // links: this.unwrap(links, 'links'),
      // technical: this.unwrap(technical, 'technical'),
    };
  }

  /**
   * Дістає значення з PromiseSettledResult, логує помилку якщо екстрактор впав,
   * але не валить весь запит — інші таби мають залишитись доступні.
   */
  private unwrap<T>(result: PromiseSettledResult<T>, label: string): T | null {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    this.logger.error(`Extractor "${label}" failed: ${result.reason}`);
    return null;
  }
}
