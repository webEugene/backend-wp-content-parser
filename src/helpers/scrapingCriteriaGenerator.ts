import * as fs from 'node:fs/promises';
import { CRITERIA_DIR, DEFAULT_SCRAPING_CRITERIA } from '../common/constants';
import { BadRequestException } from '@nestjs/common';
import { cleanHostname } from './cleanHostname';

export const scrapingCriteriaGenerator = async (url, classNames) => {
  const host: string = cleanHostname(url);
  const criteriaJsonFile: string = `${CRITERIA_DIR}/${host}.json`;

  for (const classItem in classNames) {
    if (
      DEFAULT_SCRAPING_CRITERIA[classItem] &&
      classNames[classItem].title !== ''
    ) {
      DEFAULT_SCRAPING_CRITERIA[classItem].title = classNames[classItem].title;
    }

    if (
      DEFAULT_SCRAPING_CRITERIA[classItem] &&
      classNames[classItem].content !== ''
    ) {
      DEFAULT_SCRAPING_CRITERIA[classItem].content = Array.of(
        classNames[classItem].content,
      );
    }
  }

  try {
    await fs.writeFile(
      `${criteriaJsonFile}`,
      JSON.stringify(DEFAULT_SCRAPING_CRITERIA, null, 1),
      { encoding: 'utf8', mode: '0644', flag: 'a' },
    );
  } catch (e) {
    throw new BadRequestException('Something bad happened', {
      cause: new Error(),
      description: `Something bad happened while writing to file ${criteriaJsonFile}`,
    });
  }
};
