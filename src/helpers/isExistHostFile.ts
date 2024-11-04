import * as fs from 'node:fs/promises';

type IsExistHostFileType = {
  host: string;
  directory: string;
  fileName?: string;
};
export const isExistHostFile = async (
  data: IsExistHostFileType,
): Promise<boolean> => {
  const file: string = `${data.host}${data.fileName}.json`;

  const result: string[] = await fs.readdir(data.directory);
  const checkIfExist: string[] = result.filter((item) => item === file);

  return !!(checkIfExist.length && checkIfExist[0]);
};
