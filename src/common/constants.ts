export const CRITERIA_DIR = 'static/criteria';
export const STORAGE_DIR = 'static/storage';
export const SITEMAP_URLS_DIR = 'static/sitemap-urls';

export const SITEMAP_VARIANTS_LIST: string[] = [
  'sitemap-index.xml',
  'sitemap.xml',
  'sitemap.php',
  'sitemap.txt',
  'sitemap_index.xml',
  'sitemap.xml.gz',
  'sitemap/',
  'sitemap',
  'sitemap/sitemap.xml',
  'sitemapindex.xml',
  'sitemap/index.xml',
  'sitemap1.xml',
];

/**
 * Default criteria JSON
 *
 * @type {{single: {h1: string, content: [string]}, default: {h1: string, content: [string]}, pageType: string, description: string, archive: {h1: string, content: [string]}, page: {h1: string, content: [string]}, title: string, home: {h1: string, content: [string]}}}
 */
export const DEFAULT_SCRAPING_CRITERIA = {
  pageType: 'pageType',
  metaTitle: 'title',
  metaDescription: 'meta[name="description"]',
  home: {
    title: 'h1',
    content: ['div.content-bl'],
  },
  page: {
    title: 'h1',
    content: ['div.content-bl'],
  },
  single: {
    title: 'h1',
    content: ['div.content-bl'],
  },
  archive: {
    title: 'h1',
    content: ['div.content-bl'],
  },
  default: {
    title: 'h1',
    content: ['div.content-bl'],
  },
};
