import { json2csv } from 'json-2-csv';
import * as fs from 'node:fs/promises';
import { STORAGE_DIR } from '../common/constants';
import { BadRequestException } from '@nestjs/common';

export const saveParsedDataToCsv = async (host, data) => {
  const csv = json2csv(data);
  const dateFormed = `${new Date().toLocaleDateString()}_${+new Date()}`;
  const csvFile: string = `${STORAGE_DIR}/${host}_${dateFormed}.csv`;

  try {
    await fs.writeFile(`${csvFile}`, csv);
  } catch (e) {
    throw new BadRequestException('Something bad happened', {
      cause: new Error(),
      description: `Something bad happened while writing to file ${csvFile}`,
    });
  }
};
