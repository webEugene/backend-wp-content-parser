import * as cheerio from 'cheerio';

export interface SocialResult {
  twitter: string | null;
  facebook: string | null;
  linkedin: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  pinterest: string | null;
  telegram: string | null;
  github: string | null;
  whatsapp: string | null;
  viber: string | null;
}

/**
 * Кожна мережа — масив патернів для перевірки href.
 * Порядок важливий: перший збіг виграє.
 * Для WhatsApp/Viber — специфічні схеми (wa.me, viber://)
 */
const SOCIAL_PATTERNS: Array<{
  key: keyof SocialResult;
  patterns: RegExp[];
}> = [
  {
    key: 'twitter',
    patterns: [
      /https?:\/\/(www\.)?(twitter|x)\.com\/(?!share|intent|home|search)[a-zA-Z0-9_]+/,
    ],
  },
  {
    key: 'facebook',
    patterns: [
      /https?:\/\/(www\.)?facebook\.com\/(?!sharer|share|dialog)[a-zA-Z0-9._-]+/,
    ],
  },
  {
    key: 'linkedin',
    patterns: [
      /https?:\/\/(www\.)?linkedin\.com\/(company|in|school)\/[a-zA-Z0-9_-]+/,
    ],
  },
  {
    key: 'instagram',
    patterns: [/https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+/],
  },
  {
    key: 'youtube',
    patterns: [
      /https?:\/\/(www\.|m\.)?youtube\.com\/(@|(channel|c|user)\/)[a-zA-Z0-9._-]+/,
    ],
  },
  {
    key: 'tiktok',
    patterns: [/https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+/],
  },
  {
    key: 'pinterest',
    patterns: [/https?:\/\/(www\.)?pinterest\.(com|ca|co\.uk)\/[a-zA-Z0-9_-]+/],
  },
  {
    key: 'telegram',
    patterns: [
      /https?:\/\/(www\.)?t\.me\/[a-zA-Z0-9_]+/,
      /https?:\/\/(www\.)?telegram\.me\/[a-zA-Z0-9_]+/,
    ],
  },
  {
    key: 'github',
    patterns: [/https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+/],
  },
  {
    key: 'whatsapp',
    patterns: [
      /https?:\/\/wa\.me\/[0-9+]+/,
      /https?:\/\/(api\.)?whatsapp\.com\/send\?phone=[0-9+]+/,
    ],
  },
  {
    key: 'viber',
    patterns: [
      /viber:\/\/chat\?number=[+0-9]+/,
      /https?:\/\/(www\.)?viber\.com\/[a-zA-Z0-9_-]+/,
    ],
  },
];

export async function extractSocial(html: string): Promise<SocialResult> {
  const $ = cheerio.load(html);
  const result: SocialResult = {
    twitter: null,
    facebook: null,
    linkedin: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    pinterest: null,
    telegram: null,
    github: null,
    whatsapp: null,
    viber: null,
  };

  // Збираємо всі href з якорів один раз
  const hrefs: string[] = [];
  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href');
    if (href) hrefs.push(href.trim());
  });

  for (const { key, patterns } of SOCIAL_PATTERNS) {
    if (result[key]) continue; // вже знайдено — пропускаємо

    for (const href of hrefs) {
      const matched = patterns.some((pattern) => pattern.test(href));
      if (matched) {
        result[key] = href;
        break; // беремо перший збіг для цієї мережі
      }
    }
  }

  return result;
}
