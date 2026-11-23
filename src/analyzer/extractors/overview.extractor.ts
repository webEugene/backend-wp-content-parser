import { OverviewResult } from '../types/analyzer-result.type';

export async function extractOverview(
  html: string,
  url: string,
): Promise<OverviewResult> {
  // TODO: реалізація — Cheerio парсинг title/description/favicon/lang + CMS detection
  throw new Error('Not implemented yet');
}
