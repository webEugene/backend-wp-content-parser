export interface OverviewResult {
  title: string | null;
  description: string | null;
  favicon: string | null;
  language: string | null;
  cms: string | null;
}

/**
 * Категорія email — визначається по локальній частині адреси
 * (info@, support@, sales@...). "other" — все що не підпало під
 * відомі префікси.
 */
export type EmailCategory =
  'info' | 'support' | 'sales' | 'hr' | 'press' | 'billing' | 'other';

export interface EmailGroup {
  category: EmailCategory;
  emails: string[];
}

export interface PhoneEntry {
  raw: string; // як знайдено на сторінці, без обробки
  formatted: string | null; // E.164 чи null якщо не вдалось розпарсити
  country: string | null; // ISO 3166-1 alpha-2, напр. "US", "UA"
  valid: boolean;
}

export interface AddressEntry {
  streetAddress: string | null;
  addressLocality: string | null; // місто
  addressRegion: string | null; // область/штат
  postalCode: string | null;
  addressCountry: string | null;
  raw: Record<string, any>; // оригінальний Schema.org об'єкт, для дебагу/розширення
}

export interface ContactsResult {
  emails: EmailGroup[];
  phones: PhoneEntry[];
  addresses: AddressEntry[];
}

export interface SocialResult {
  twitter: string | null;
  facebook: string | null;
  linkedin: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
}

export interface LinkItem {
  link: string;
  title: string;
  origin: string;
}

export interface LinksResult {
  domain: string;
  data: LinkItem[];
}

export interface TechnicalResult {
  sitemapUrls: string[];
  robotsTxt: string | null;
  metaTags: Record<string, string>;
  schemaTypes: string[];
}

/**
 * Інформація про доступ до сторінки — переноситься з ParseResult.blockDetection,
 * щоб фронт міг показати юзеру "дані можуть бути неповні через Cloudflare" і т.п.
 */
export interface AccessInfo {
  statusCode: number;
  isBlocked: boolean;
  blockerType: string | null;
  severity: 'none' | 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface AnalyzerResult {
  access: AccessInfo;
  // overview: OverviewResult | null;
  contacts: ContactsResult | null;
  social: SocialResult | null;
  // links: LinksResult | null;
  // technical: TechnicalResult | null;
}
