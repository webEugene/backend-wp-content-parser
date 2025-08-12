/**
 * Helper to create camel case word
 */
export const createTypeName = (word: string): string => {
  const dividedWord: string[] = word.split('-');

  if (dividedWord.length === 1) return dividedWord[0];

  const capitalized =
    dividedWord[1].charAt(0).toUpperCase() + dividedWord[1].slice(1);

  return dividedWord[0] + capitalized;
};
