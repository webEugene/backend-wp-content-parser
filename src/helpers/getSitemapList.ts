import { SITEMAP_URLS_DIR } from '../common/constants';
import { readFile } from 'node:fs/promises';

export const getSitemapList = async (host: string) => {
  const filePath = `${SITEMAP_URLS_DIR}/${host}_sitemap_url.json`;

  return await readSitemapList(filePath);
};

export const readSitemapList = async (filePath: string) => {
  try {
    const result = await readFile(filePath, 'utf8');

    return JSON.parse(result);
  } catch (e) {
    return {
      error: e.message,
    };
  }
};
