import * as fs from 'node:fs/promises';
import { NotFoundException } from '@nestjs/common';

type UnlinkHostFileType = {
  host: string;
  directory: string;
  fileName?: string;
};

export const unlinkFile = async (data: UnlinkHostFileType) => {
  const file: string = `${data.directory}/${data.host}${data.fileName}.json`;

  try {
    await fs.unlink(file);
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new NotFoundException({
        message: 'Incorrect path or file does not exist',
      });
    }
  }
};
