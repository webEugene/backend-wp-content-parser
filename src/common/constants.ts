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
  frontPage: {
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
  singlePost: {
    title: 'h1',
    content: [],
  },
  singleAttachment: {
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
};

export const HEADER_REQUEST = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
  },
};
