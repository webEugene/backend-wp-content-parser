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

export const TYPE_PAGES_LIST = [
  'index',
  'home',
  'front-page',
  'page',
  'single',
  'single-post',
  'single-attachment',
  'category',
  'archive',
  'taxonomy',
  'tag',
  'search',
  'attachment',
];

/**
 * Default criteria JSON
 *
 * @type {{single: {h1: string, content: [string]}, default: {h1: string, content: [string]}, pageType: string, description: string, archive: {h1: string, content: [string]}, page: {h1: string, content: [string]}, title: string, home: {h1: string, content: [string]}}}
 */
export const DEFAULT_SCRAPING_CRITERIA = {
  index: {
    title: 'h1',
    content: [],
  },
  front_page: {
    title: 'h1',
    content: [],
  },
  home: {
    title: 'h1',
    content: [],
  },
  page: {
    title: 'h1',
    content: [],
  },
  single: {
    title: 'h1',
    content: [],
  },
  single_post: {
    title: 'h1',
    content: [],
  },
  single_attachment: {
    title: 'h1',
    content: [],
  },
  archive: {
    title: 'h1',
    content: [],
  },
  category: {
    title: 'h1',
    content: [],
  },
  taxonomy: {
    title: 'h1',
    content: [],
  },
  tag: {
    title: 'h1',
    content: [],
  },
  search: {
    title: 'h1',
    content: [],
  },
  attachment: {
    title: 'h1',
    content: [],
  },
  default: {
    title: 'h1',
    content: [],
  },
};
