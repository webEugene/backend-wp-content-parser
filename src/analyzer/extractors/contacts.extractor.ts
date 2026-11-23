import * as cheerio from 'cheerio';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  AddressEntry,
  ContactsResult,
  EmailCategory,
  EmailGroup,
  PhoneEntry,
} from '../types/analyzer-result.type';

const EMAIL_DOMAIN_BLOCKLIST = [
  'sentry.io',
  'wixpress.com',
  'example.com',
  'domain.com',
  'yourdomain.com',
  'godaddy.com',
];

const EMAIL_CATEGORY_RULES: Array<{
  category: EmailCategory;
  patterns: string[];
}> = [
  { category: 'support', patterns: ['support', 'help', 'service'] },
  { category: 'sales', patterns: ['sales', 'business', 'partnership'] },
  { category: 'hr', patterns: ['hr', 'career', 'jobs', 'recruit'] },
  { category: 'press', patterns: ['press', 'media', 'pr'] },
  { category: 'billing', patterns: ['billing', 'invoice', 'payment'] },
  { category: 'info', patterns: ['info', 'contact', 'hello', 'office'] },
];

function categorizeEmail(email: string): EmailCategory {
  const localPart = email.split('@')[0].toLowerCase();
  for (const rule of EMAIL_CATEGORY_RULES) {
    if (rule.patterns.some((p) => localPart.includes(p))) return rule.category;
  }
  return 'other';
}

function extractEmails($: cheerio.CheerioAPI, html: string): EmailGroup[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  const fromMailto: string[] = [];
  $('a[href^="mailto:"]').each((_i, el) => {
    const email = ($(el).attr('href') || '')
      .replace('mailto:', '')
      .split('?')[0]
      .trim();
    if (email) fromMailto.push(email);
  });

  const fromText = html.match(emailRegex) ?? [];

  const uniqueEmails = Array.from(
    new Set([...fromMailto, ...fromText].map((e) => e.toLowerCase().trim())),
  ).filter((email) => {
    const domain = email.split('@')[1];
    return domain && !EMAIL_DOMAIN_BLOCKLIST.includes(domain);
  });

  const grouped = new Map<EmailCategory, string[]>();
  for (const email of uniqueEmails) {
    const category = categorizeEmail(email);
    grouped.set(category, [...(grouped.get(category) ?? []), email]);
  }

  return Array.from(grouped.entries()).map(([category, emails]) => ({
    category,
    emails,
  }));
}

function extractPhones(
  $: cheerio.CheerioAPI,
  html: string,
  url: string,
): PhoneEntry[] {
  const tld = new URL(url).hostname.split('.').pop()?.toUpperCase();
  const TLD_TO_COUNTRY: Record<string, string> = {
    UA: 'UA',
    PL: 'PL',
    DE: 'DE',
    FR: 'FR',
    UK: 'GB',
    IT: 'IT',
    ES: 'ES',
    NL: 'NL',
    CZ: 'CZ',
    SK: 'SK',
  };
  const defaultCountry = (tld && TLD_TO_COUNTRY[tld]) || 'US';

  const fromTel: string[] = [];
  $('a[href^="tel:"]').each((_i, el) => {
    const phone = ($(el).attr('href') || '').replace('tel:', '').trim();
    if (phone) fromTel.push(phone);
  });

  const fromText = html.match(/(\+?\d[\d\s().-]{7,}\d)/g) ?? [];

  const seenFormatted = new Set<string>();
  const phones: PhoneEntry[] = [];

  for (const raw of Array.from(new Set([...fromTel, ...fromText]))) {
    const parsed = parsePhoneNumberFromString(raw, defaultCountry as any);
    if (!parsed?.isValid()) continue;

    const formatted = parsed.format('E.164');
    if (seenFormatted.has(formatted)) continue;
    seenFormatted.add(formatted);

    phones.push({
      raw,
      formatted,
      country: parsed.country ?? null,
      valid: true,
    });
  }

  return phones;
}

function extractAddresses($: cheerio.CheerioAPI): AddressEntry[] {
  const addresses: AddressEntry[] = [];

  $('script[type="application/ld+json"]').each((_i, el) => {
    let json: any;
    try {
      json = JSON.parse($(el).contents().text());
    } catch {
      return;
    }

    const nodes = Array.isArray(json) ? json : (json['@graph'] ?? [json]);
    for (const node of nodes) {
      const address = node?.address;
      if (!address || address['@type'] !== 'PostalAddress') continue;
      addresses.push({
        streetAddress: address.streetAddress ?? null,
        addressLocality: address.addressLocality ?? null,
        addressRegion: address.addressRegion ?? null,
        postalCode: address.postalCode ?? null,
        addressCountry: address.addressCountry ?? null,
        raw: address,
      });
    }
  });

  return addresses;
}

export async function extractContacts(
  html: string,
  url: string,
  options: { isBlocked: boolean },
): Promise<ContactsResult> {
  const $ = cheerio.load(html);
  return {
    emails: extractEmails($, html),
    // При isBlocked пропускаємо regex по тексту — там сміття від захисту
    phones: options.isBlocked ? [] : extractPhones($, html, url),
    addresses: extractAddresses($),
  };
}
