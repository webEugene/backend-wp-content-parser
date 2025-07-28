import * as cheerio from 'cheerio';
import { findCurrentPage } from './findCurrentPage';

/**
 * Formatting parsed data and prepare to save
 *
 * @param data
 * @param criteria
 * @param link
 *
 // * @returns {{'Page Type': *, 'Meta Description': (*|jQuery|string), 'Main content': string, 'Date time': string, 'Parsing Link', 'Meta Title': (*|jQuery|string), 'Main Title h1': (jQuery|*|string), 'Content Images Alt': string}}
 */
export const formattingContent = (data, criteria, link) => {
  const $ = cheerio.load(data);
  const bodyClass = $('body').attr('class');

  if (bodyClass === 'undefined')
    throw new Error(`Parsing page ${link} has been missed! Status: 404`);

  const currentPage = findCurrentPage(bodyClass);
  const titleTmp = $(criteria.metaTitle).html();
  const descriptionTmp = $(criteria.metaDescription).attr('content');
  // console.log(criteria, currentPage);
  const h1Title = $(criteria[currentPage].title).html() ?? '';
  // const content = criteria[currentPage].content
  //   .map((contentClass) => {
  //     return $(contentClass).html()
  //       ? $(contentClass).html().replace(/\s\s+/g, '')
  //       : '';
  //   })
  //   .join(' ');

  const cheerioRules = {
    title: titleTmp || 'Title is missing!',
    description: descriptionTmp || 'Description is missing!',
    h1Title: h1Title.trim() || 'h1 title is missing!',
    // content: content || 'Content is missing!',
    // alts: altsImagesExtractor(content) || 'Alts are missing!',
  };

  return {
    'Date time': new Date().toLocaleString(),
    'Page Type': currentPage,
    'Parsing Link': link,
    'Meta Title': cheerioRules.title,
    'Meta Description': cheerioRules.description,
    'Main Title h1': cheerioRules.h1Title,
    // 'Main content': `<div class=\"parsed-content\">${cheerioRules.content}</div>`,
    // 'Content Images Alt': cheerioRules.alts,
  };
};
