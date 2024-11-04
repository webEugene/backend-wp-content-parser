import * as fs from 'node:fs/promises';
import { BadRequestException } from '@nestjs/common';

export const getSiteCriteria = async (filePath) => {
  try {
    const result = await fs.readFile(filePath, 'utf8');

    return JSON.parse(result);
  } catch (e) {
    throw new BadRequestException('Something bad happened', {
      cause: new Error(),
      description: `Something bad happened while READING ${filePath}`,
    });
  }
};
