import * as cheerio from 'cheerio';
import { LinkItem, LinksResult } from '../types/analyzer-result.type';

export async function extractLinks(
  html: string,
  url: string,
): Promise<LinksResult> {
  const $ = cheerio.load(html);
  const domainOrigin = new URL(url).origin;
  const links: LinkItem[] = [];

  $(`a:link:not([href^=javascript])`).each((_index, element) => {
    const href = $(element).attr('href');
    const title = $(element).text().trim();

    if (!href || href.trim() === '') return;

    // Резолвимо ВСІ посилання (абсолютні і відносні) через базовий url —
    // це виправляє баг оригінального методу, де origin для відносних
    // шляхів (/contact-us) записувався як сам цей шлях, а не реальний домен.
    let origin: string;
    try {
      origin = new URL(href, url).origin;
    } catch {
      // href не є валідним URL навіть з базою (наприклад "mailto:", "tel:")
      origin = domainOrigin;
    }

    links.push({
      link: href === '/' || href === '#' ? domainOrigin : href,
      title,
      origin,
    });
  });

  return {
    domain: domainOrigin,
    data: links,
  };
}
