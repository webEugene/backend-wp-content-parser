import { DEFAULT_SCRAPING_CRITERIA } from '../common/constants';

/**
 * Helper to construct a section (title + content)
 */
export const buildSection = (
  criteria: Record<string, any>,
  key: string,
): { title: string; content: string[] } => {
  return {
    title: criteria?.[`${key}Title`] ?? DEFAULT_SCRAPING_CRITERIA[key]?.title,
    content: criteria?.[`${key}Content`]
      ? [criteria[`${key}Content`]]
      : DEFAULT_SCRAPING_CRITERIA[key]?.content,
  };
};
