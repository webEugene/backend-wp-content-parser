import { TYPE_PAGES_LIST } from '../common/constants';
import { createTypeName } from './createTypeName';

type PageType = (typeof TYPE_PAGES_LIST)[number] | 'index';

/**
 * Determines the current page type based on the body class.
 *
 * @param bodyClass - The class attribute of the body element
 * @returns A string representing the current page type
 */
export const findCurrentPage = (
  bodyClass: string | null | undefined,
): PageType => {
  if (!bodyClass || typeof bodyClass !== 'string') return 'index';

  const classList = bodyClass.trim().split(/\s+/);

  const found = TYPE_PAGES_LIST.find((page) => classList.includes(page));

  return found ? createTypeName(found) : 'index';
};
