export const validateUrl = (url) => {
  const urlPattern =
    /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  const trailingSlashPattern = /\/$/;

  const withTrailingSlash = !trailingSlashPattern.test(url) ? `${url}/` : url;

  if (!urlPattern.test(withTrailingSlash)) {
    return `https://${withTrailingSlash}`;
  } else {
    return withTrailingSlash;
  }
};
