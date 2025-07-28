import { readFile } from 'node:fs/promises';

import {
  DEFAULT_SCRAPING_CRITERIA,
  SITEMAP_URLS_DIR,
  TYPE_PAGES_LIST,
} from '../common/constants';

/**
 * Reads and parses the scraping criteria for a specific host
 */
export const getSiteCriteria = async (host: string) => {
  const filePath = `${SITEMAP_URLS_DIR}/${host}_sitemap_url.json`;

  return await getCriteria(filePath);
};

/**
 * Reads a file and parses JSON, falling back to defaults
 */
export const getCriteria = async (filePath: string) => {
  try {
    const result = await readFile(filePath, 'utf8');

    return JSON.parse(result);
  } catch (e) {
    return DEFAULT_SCRAPING_CRITERIA;
  }
};

/**
 * Helper to construct a section (title + content)
 */
const buildSection = (
  criteria: Record<string, any>,
  key: string,
): { title: string; content: string[] } => {
  const formatName = key.replace(/-/g, '_');

  return {
    title:
      criteria?.[`${formatName}Title`] ??
      DEFAULT_SCRAPING_CRITERIA[formatName]?.title,
    content: criteria?.[`${formatName}Content`]
      ? [criteria[`${formatName}Content`]]
      : DEFAULT_SCRAPING_CRITERIA[formatName]?.content,
  };
};

export const createCriteria = (criteria: Record<string, any> = {}) => {
  const sections = Object.fromEntries(
    TYPE_PAGES_LIST.map((key) => [key, buildSection(criteria, key)]),
  );
  console.log(sections);
  return {
    pageType: 'pageType',
    metaTitle: 'title',
    metaDescription: 'meta[name="description"]',
    ...sections,
  };
};
