const typePagesList = ['home', 'single', 'page', 'archive'];
/**
 * Find current page
 *
 * @param bodyClass
 * @returns {string}
 */
export const findCurrentPage = (bodyClass) => {
  if (bodyClass === 'undefined' || bodyClass === null || bodyClass === '')
    return 'default';

  return (
    typePagesList.find((item) => bodyClass.split(' ').includes(item)) ??
    'default'
  );
};
